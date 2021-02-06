(function() {
	if (!localStorage.getItem('cookieconsent')) {
    var consentContainer = document.getElementById("cookieconsent");
		consentContainer.innerHTML += '\
		<div class="cookieconsent" style="position:fixed;padding:20px;left:0;bottom:0;background-color:#000;color:#FFF;text-align:center;width:100%;z-index:99999;">\
			We use cookies to improve your experience on our site. By using our site you consent cookies. <a style="color: #fff;font-weight: bold;text-decoration: underline!important;" href="/about/cookies">Learn more</a> \
			<a id="enableCookies" style="color: #000;margin-left: 35px;font-weight: bold;font-size: 14px;padding: 6px 15px;border-radius: 8px; background: #fff; cursor:pointer">Ok</a>\
		</div>\
		';
		document.querySelector('.cookieconsent #enableCookies').onclick = function(e) {
			e.preventDefault();
			document.querySelector('.cookieconsent').style.display = 'none';
			localStorage.setItem('cookieconsent', true);
		};
	}
})();
