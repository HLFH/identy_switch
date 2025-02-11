/*
 * 	Identy switch RoundCube Bundle
 *
 *	@copyright	(c) 2024 Forian Daeumling, Germany. All right reserved
 * 	@license 	LGPL-3.0-or-later
 */

$(function() {
	$sw = $('#identy_switch_menu');
	isOk = false;

	switch (rcmail.env['skin']) {
	case 'larry':
		isOk = identy_switch_addCbLarry($sw);
		break;
			
	case 'classic':
		isOk = identy_switch_addCbClassic($sw);
		break;

    case 'elastic':
        isOk = identy_switch_addCbElastic($sw);
    
    default:
		break;
	}

	if (isOk)
        $sw.show();
});

// Plugin initialization
function identy_switch_init() {
    rcmail.addEventListener('plugin.identy_switch_notify', identy_switch_notify)
    	  .addEventListener('init', function() {
            // Bind to messages list select event, so favicon will be reverted on message preview too
            if (rcmail.message_list)
                rcmail.message_list.addEventListener('select', identy_switch_stop_notify);
    });
}

// Set menu position
function identy_switch_addCbLarry($sw) {
	var $truName = $('.topright .username');
	
	if ($truName.length > 0) {
		if ($sw.length > 0) {
			$sw.prependTo('#taskbar');
			$truName.hide();
			// Move our selection menu a bit to the right
			$('#identy_switch_menu').css('padding-top', '4px').css('padding-bottom', '4px');
			$('#identy_switch_dropdown').css('margin-left', '-92px');

			return true;
		}
	}

	return false;
}

// Set menu position
function identy_switch_addCbClassic($sw) {
	var $taskBar = $('#taskbar');
	
	if ($taskBar.length > 0) {
		$taskBar.prepend($sw);
		// Move our selection menu a bit to the right
		$('#identy_switch_menu').css('margin-left', '100px')
			.css('margin-top', '32px')
			.css('padding-top', '4px')
			.css('padding-bottom', '4px');
		$('#identy_switch_dropdown')
			.css('left', 'inherit')
			.css('margin-left', '295px')
			.css('margin-top', '30px');
	
		return true;
	}

	return false;
}

// Set menu position
function identy_switch_addCbElastic($sw) {
    var $taskBar = $('.header-title.username');
    
    $sw.css('background-color', 'transparent').css('padding','4px 0 0 2rem');
    if ($taskBar.length > 0) {
        $taskBar.prepend($sw);
        $taskBar.css('margin-left', '20px');

		// Remove text from <span>
	    var $node = $('.header-title.username');
	 
		var newNode = $('<' + $node[0].nodeName + '/>');
		$.each( $node[0].attributes, function ( i, attribute ) {
	        newNode.attr(attribute.name, attribute.value);
		});
	  	$node.children().each(function(){
	    	newNode.append(this);
	  	});
	  	$node.replaceWith(newNode);

		// Move our selection menu a bit to the bottom
		$('#identy_switch_menu')
			.css('height', '30px')
			.css('width', '180px');
		$('#identy_switch_dropdown')
			.css('left', '9px')
			.css('margin-top', '0');
		
        return true;
    }
 
    return false;
}

// Change userid in composer window to select proper identity
function identy_switch_fixIdent(iid) {
	if (parseInt(iid) > 0)
		$("#_from").val(iid);
}

// Open/close menu
function identy_switch_toggle_menu() {
	var d = $('#identy_switch_dropdown'); 

	if (d.is(':hidden')) {
		// Reload window to show new mail counter in menu
		d.load(location.href + ' #identy_switch_dropdown > *', '');
		d.show();
	} else
		d.hide();
}

// Switch identity
function identy_switch_run(iid) {
	
    rcmail.env.unread_counts = {};
	rcmail.http_post('plugin.identy_switch_do', { 'identy_switch_iid': iid });
}

// Perform notification
function identy_switch_notify(ctl) {

	var autoplay = decodeURI(ctl[0].autoplay);
	var notification = decodeURI(ctl[0].notification);
	var title = decodeURI(ctl[0].title);
	
 	for (var i = 1; i < ctl.length; i++) {
		var e = $('#identy_switch_opt_' + ctl[i].iid);
		if (ctl[i].unseen == '0')
			e.text('');
		else
			e.text(ctl[i].unseen);

		if (ctl[i].basic !== undefined)
			identy_switch_basic();
		if (ctl[i].desktop !== undefined) 
			identy_switch_desktop(title, ctl[i].desktop.text, ctl[i].desktop.timeout, notification);
		if (ctl[i].sound !== undefined)
			identy_switch_sound(autoplay);
	}
}

// Stops notification
function identy_switch_stop_notify(prop)
{
    // Revert original favicon
    if (rcmail.env.favicon_href && rcmail.env.favicon_changed && (!prop || prop.action != 'check-recent')) {
        $('<link rel="shortcut icon" href="'+rcmail.env.favicon_href+'"/>').replaceAll('link[rel="shortcut icon"]');
        rcmail.env.favicon_changed = 0;
    }
}

// Browser notification: window.focus and favicon change
function identy_switch_basic()
{
    var w = rcmail.is_framed() ? window.parent : window;
    w.focus();

    var src = rcmail.assets_path('plugins/identy_switch/assets');

    // We cannot simply change a href attribute, we must to replace the link element (at least in FF)
	var link = $('<link rel="shortcut icon">').attr('href', src + '/alert.ico');
 	var olink = $('link[rel="shortcut icon"]', w.document);
    if (!rcmail.env.favicon_href)
        rcmail.env.favicon_href = olink.attr('href');

    rcmail.env.favicon_changed = 1;
    link.replaceAll(olink);
}

// Desktop notification
// - Require window.Notification API support (Chrome 22+ or Firefox 22+)
function identy_switch_desktop(title, msg, timeout, errmsg)
{
	if (!('Notification' in window) || window.Notification.permission !== "granted") {
		alert(decodeURI(errmsg));
		window.Notification.requestPermission();
		return;
	}
		 
    var popup = new window.Notification(decodeURI(title), {
                dir: "auto",
                lang: "",
                body: decodeURI(msg),
                icon: rcmail.assets_path('plugins/identy_switch/assets/alert.gif')
            });
	popup.onclick = function() { this.close(); };
	setTimeout(function() { popup.close(); }, timeout * 1000);
}

// Sound notification
function identy_switch_sound(errmsg) {
    var src = rcmail.assets_path('plugins/identy_switch/assets/alert');

	if (!('Notification' in window) || window.Notification.silent) {
		alert(decodeURI(errmsg));
		return;
	}
		 
	if (!('Navigator' in window) && window.Navigator.getAutoplayPolicy &&
		window.Navigator.getAutoplayPolicy('mediaelement') != 'allowed') {
		alert(decodeURI(errmsg));
		window.Notification.requestPermission();
		return;
	}
	
    new Audio(src + '.mp3').play();
}