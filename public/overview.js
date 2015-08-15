var serverCount = 0;
var socket = io.connect();

function createMultiArrayInfo(id, label, values) {
    var text = '';
    if (values.length > 0) {
        values.forEach(function (load, i) {
            text += '<div id="' + id + '_' + i + '" class="multiArray"' +
                    'style="width: '+ (1 / values.length * 90) + '%" />';
        });
        
        text += '<div class="label" style="margin-top: -32px">' + label + '</div>';
    }
    return text;
}

function setProgressBar(id, _value) {
    $(id).progressbar({
        value: parseInt(_value.value, 10),
        max: parseInt(_value.max, 10)
    });
    
    if (_value.high !== undefined && _value.value > _value.high) {
        $(id + " div").removeClass('medium').addClass('high');
    } else if (_value.medium !== undefined && _value.value > _value.medium) {
        $(id + " div").removeClass('high').addClass('medium');
    } else {
        $(id + " div").removeClass('high').removeClass('medium');
    }
}

function addStatusElements(id, _status) {
    var newElement = '';
    for (var i = 0; i < _status.length; i++) {
        newElement += '<div id="item_' + i + '_' + id + '" class="status">';
        
        // the status can be displayed as single progress bar
        if (_status[i].value !== undefined && _status[i].max !== undefined) {
            newElement += '<div class="label">' + _status[i].label + '</div>';
            
        // the status can be displayed as multiple progress bars
        } else if (_status[i].values !== undefined) {
            newElement += createMultiArrayInfo('item_' + i + '_' + id, _status[i].label, _status[i].values);
        }
        
        newElement += '</div>';
    }
    
    $('#overview_' + id).html(newElement);
}

function addNewServerInfo(id, _status) {
    var newElement = '<div id="server_' + id + '" class="serverInfo">' +
            '<h3>' +
            '<div class="hostname">' + _status.host + '</div>' +
            '<div class="offline" id="offline_' + id + '">offline</div>' +
            '<div class="online" id="online_' + id + '">online</div>' +
            '<div id="overview_' + id + '" />' +
            '<div class="clear" />' + // clear possible open floats
            '</h3>' +
            '<div id="details_' + id + '">' +
            '<div class="clear" />' + // clear possible open floats
            '</div>' +
        '</div>';
    
    $('#serverStatus').append(newElement);
    
    $('#server_' + id).accordion({
        collapsible: true,
        active: false
    });
    
    if ($('#serverStatus .serverInfo').length === serverCount) {
        $('#loaderIcon').hide();
    }
}

function updateServerOverview(id, _status) {
    var overview_id = '#overview_' + id;
    
    if (_status.status !== undefined && _status.status.message !== undefined) {
        $('#details_' + id).html(_status.status.message);
    }
    
    if (_status.status === undefined || _status.status.status === 'offline') {
        $('#offline_' + id).show();
        $('#online_' + id).hide();
        $(overview_id).hide();
    } else if (_status.status.status === 'online') {
        $('#offline_' + id).hide();
        $('#online_' + id).show();
        $(overview_id).hide();
    } else {
        if ($(overview_id).children().length === 0) {
            addStatusElements(id, _status.status);
        } else if ($(overview_id).children().length !== _status.status.length) {
            $(overview_id).html('');
            addStatusElements(id, _status.status);
        }
        
        $('#offline_' + id).hide();
        $('#online_' + id).hide();
        $(overview_id).show();
        
        for (var i = 0; i < _status.status.length; i++) {
            var item_id = '#item_' + i + '_' + id;
            
            // the status can be displayed as single progress bar
            if (_status.status[i].value !== undefined && _status.status[i].max !== undefined) {
                setProgressBar(item_id, _status.status[i]);
                
            // the status can be displayed as multiple progress bars
            } else if (_status.status[i].values !== undefined) {
                if ($(item_id).children().length === 0) {
                    $(item_id).html(createMultiArrayInfo('item_' + i + '_' + id,
                            _status.status[i].label,
                            _status.status[i].values));
                }

                for (var j = 0; j < _status.status[i].values.length; j++) {
                    setProgressBar(item_id + '_' + j, _status.status[i].values[j]);
                }
                
            // plain status displaying
            } else if (_status.status[i].value !== undefined) {
                $(item_id).html(_status.status[i].label + ': ' + _status.status[i].value);
            }
        }
    }

    $('#server_' + id)
        .accordion('refresh')
        // load details on tab opening
        .on('accordionbeforeactivate', function(event, ui) {
            if (ui.oldHeader.length === 0 && $('#overview_' + id).is(':visible')) {
                $('#details_' + id).html('<img src="loader.gif" alt="Loading details, please wait..." title="Loading details, please wait..." />');
                $('#server_' + id).accordion('refresh');
            }
        })
        .on('accordionactivate', function(event, ui) {
            if (ui.oldHeader.length === 0 && $('#overview_' + id).is(':visible')) {
                socket.emit('getDetails', _status.host);
                $('#server_' + id).accordion('refresh');
            }
        });
}

function createDetailsArray(_detail) {
    var details_html = '<div class="detail">';
    if (_detail instanceof Array) {
        _detail.forEach(function(sub_detail) {
            details_html += createDetailsArray(sub_detail);
        });
    } else if (_detail !== undefined) {
        details_html += '<b>' + _detail.label + '</b>: ' + _detail.value;
    }
    details_html += '</div>';
    
    return details_html;
}

function updateServerDetails(id, _status) {
    var details_html = '';
    for (var i = 0; i < _status.status.length; i++) {
        if (_status.status[i].values !== undefined ||
                _status.status[i].value !== undefined) {
            details_html += '<div class="detail">' +
                '<div class="label">' + _status.status[i].label + '</div>';
    
            if (_status.status[i].values !== undefined) {
                details_html += createDetailsArray(_status.status[i].values);
            } else {
                details_html += '<div class="detail clear">' + _status.status[i].value.replace(/\n/g, '<br />') + '</div>';
            }
    
            details_html += '</div>';
        }
    }

    $('#details_' + id).html(details_html);
    $('#server_' + id).accordion('refresh');
}

$(function() {
    socket.on('serverCount', function(_count) {
        serverCount = _count;
        if ($('#serverStatus .serverInfo').length === serverCount) {
            $('#loaderIcon').hide();
        }
    });

    socket.on('overview', function(_status) {
        var id = _status.host;
        id = id.replace(/\.|:/g, '_');

        var serverElem = $('#server_' + id);
        if (serverElem.length === 0) {
            addNewServerInfo(id, _status);
        }

        updateServerOverview(id, _status);
    });

    socket.on('details', function(_status) {
         var id = _status.host;
         id = id.replace(/\.|:/g, '_');
        
         updateServerDetails(id, _status);
    });

    socket.on('connect', function() {
        socket.emit('getOverview');
    });
});