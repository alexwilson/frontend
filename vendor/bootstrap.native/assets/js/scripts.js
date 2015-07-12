//Modals from templates
var modalFrame = document.getElementById('myModal1'); // we need a blank modal to fill up and target our object function
var btnModal1 = document.getElementById('custom-modal-template');
btnModal1.addEventListener('click', function() {
	//template content for modal example 2
	var modal2 = new Modal(modalFrame, {
	content: 
	'<div class="modal-header">'
	+'<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>'
	+'<h4 class="modal-title" id="myModal1Label">Modal title</h4>'
	+'</div>'
	+'<div class="modal-body">'
	+'<p>This is a damn awesome modal content template.</p>'
	+'</div>'
	+'<div class="modal-footer">'
	+'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
	+'<button type="button" class="btn btn-primary">Save changes</button>'
	+'</div>'});
})

var btnModal2 = document.getElementById('custom-modal-template2');
btnModal2.addEventListener('click', function() {
	//template content for modal example 3
	var externalContent = {
		title: 'Some title coming from space, a custom variable',
		content: 'This is also a variable here, efficiently unleash cross-media information without cross-media value. Quickly maximize timely deliverables for real-time schemas. Dramatically maintain clicks-and-mortar solutions without functional solutions.',
	};
	var modal2 = new Modal(modalFrame, {
	content: 
	'<div class="modal-header">'
	+'<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>'
	+'<h4 class="modal-title" id="myModal1Label">'+externalContent.title+'</h4>'
	+'</div>'
	+'<div class="modal-body">'
	+'<p>'+externalContent.content+'</p>'
	+'</div>'
	+'<div class="modal-footer">'
	+'<button type="button" class="btn btn-danger">Delete</button>'
	+'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
	+'</div>'});
});
	
//switch views for tabs
var tabsToggleView = document.querySelector('#exampleTab .btn-group');
var tabsDemo = document.querySelector('#myTab');
tabsToggleView.addEventListener('click', function(e){
	if ( e.target.tagName === 'A' && e.target.getAttribute('data-nclass') !== undefined ) { 
		tabsDemo.className = e.target.getAttribute('data-nclass'); tabsToggleView.querySelector('button').innerHTML = 'Viewing ' + e.target.innerHTML 
	} else {
		return false;
	}	
})

//demo alert fun
var trick = document.querySelector('#exampleAlert .alert-danger'),
	trickClose = trick.querySelector('.close');
trickClose.addEventListener('click', function() {
	var title = trick.getElementsByTagName('h4')[0];
	title.innerHTML = 'Oops you REALLY got no error!';
	trick.className = 'alert alert-success fade in';
	trick.getElementsByTagName('p')[0].innerHTML = 'Who said coding Javascript isn\'t fun? I deleted the <code>data-dismiss="alert"</code> from this alert\'s dismiss button and changed it\'s handler function.'
	trick.getElementsByTagName('p')[1].innerHTML = 'I just didn\'t want this section to be empty, looks awful.'
})	

//demo popover. trigger via click
var popover1 = new Popover('#popover-via-click', { trigger: 'click'} ); //

// demo popover, using template
var someTitleFromOtherCode = 'Sample title from outer space';
var someContentFromOuterSpace = '<p>Some sample message from outer space wrapped in &lt;p&gt; tags. You can add your own functions to combine with Popover template as you wish.</p>';
var popover2 = new Popover('.popover-via-template', {
	trigger: 'focus',
	template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">'+someTitleFromOtherCode+'</h3><div class="popover-content">'+someContentFromOuterSpace+'</div></div>'
});	

//demo button
var btn = document.getElementById('myButton');
btn.addEventListener('click', function() {
	var success = document.createElement('div');
	success.innerHTML = 
				'<div class="alert alert-success alert-dismissible fade in" role="alert">'
				+  '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>'
				+  '<strong>Testing was successful!</strong><br>The buttons has been reset via <code>Button(btn,"reset")</code> option on a 2 seconds timeout after the <code>Button(btn,"loading")</code> was used.'
				+'</div>';
	
	new Button(btn,'loading');
	setTimeout(function() {
		if (btn.parentNode.nextSibling !== btn.parentNode.parentNode.querySelector('.alert') )
			btn.parentNode.parentNode.insertBefore(success.childNodes[0], btn.parentNode.nextSibling);
		new Button(btn,'reset');
	}, 2000)
})

//demo carousel-example-generic demonstrating the slid and slide events
var genericCarousel = document.getElementById('carousel-example-generic');
genericCarousel.addEventListener('slid.bs.carousel', function(e) {
	console.log( 'The #' + e.target.id + ' is about to slide, and this was the "slid" event' );	
});
genericCarousel.addEventListener('slide.bs.carousel', function(e) {
	console.log( 'The #' + e.target.id + ' has finished the slide transition, and this was the "slide" event' );	
});

//demo myCarousel demonstrating the slid and slide events
var mainSlider = document.getElementById('myCarousel');
mainSlider.addEventListener('slid.bs.carousel', function(e) {
	var active = mainSlider.querySelector('.item.active .carousel-caption');
	active.classList.remove('slide')
});
mainSlider.addEventListener('slide.bs.carousel', function(e) {
	var active = mainSlider.querySelector('.item.active .carousel-caption');
	active.classList.add('slide')
});

//demo for Button toggle
var radioBtns = document.querySelectorAll('[name="options"]'); // radios
var checkBtns = document.querySelectorAll('input[type="checkbox"]'); // checkboxes

document.querySelectorAll('[data-toggle="buttons"]')[0].addEventListener('change', function(e) {
	console.log( 'The button group with checkboxes inside changed, and you see this 3 times because there are 3 buttons inside the group' );	
});
document.querySelectorAll('[data-toggle="buttons"]')[1].addEventListener('change', function(e) {
	console.log( 'The button group with radios inside changed' );	
});

radioBtns[0].addEventListener('change', function(e) {
	console.log( 'This handler is bound by the "change" of the first radio button only.' );	
});

checkBtns[0].addEventListener('change',function() {
	console.log( 'Hopa! The first checkbox changed! This handler is bound by the "change" of the first checkbox only.' );	
})


/* side-nav autoresize on window scroll and resize */
if ( document.documentElement && !document.documentElement.classList.contains('ie') ) {
	var sideNav = document.getElementById('side-nav');
	function resetNav() {
		document.getElementById('nav-scrollspy').style.width = '';
	}
	function adjustNav() {
		var ww = window.innerWidth || document.documentElement.clientWidth;
		if ( ww >= 768 ) { 
			document.getElementById('nav-scrollspy').style.width = sideNav.offsetWidth + 'px';
		} else { resetNav() }
	}
	window.addEventListener('resize', adjustNav, false)// adjust on resize
	window.addEventListener('load', adjustNav, false)// adjust on load
}

//syntax highlighter
SyntaxHighlighter.config.tagName = 'span';
SyntaxHighlighter.all();

//fix jumpy links
document.addEventListener('click',function(e) {
	if (e.target.getAttribute('href') === '#') e.preventDefault()
})