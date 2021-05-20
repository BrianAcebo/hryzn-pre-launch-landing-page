document
  .getElementById("manage-billing-form")
  .addEventListener("click", function(e) {
    fetch('/creators/customer-portal', {
      method: 'POST'
    })
      .then(function(response) {
        return response.json()
      })
      .then(function(data) {
        window.location.href = data.url;
      })
      .catch(function(error) {
        console.error('Error:', error);
      });
  });
