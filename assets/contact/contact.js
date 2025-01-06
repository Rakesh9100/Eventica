const submitAjaxForm = event => {
    event.preventDefault()

    let form = event.target
    const formData = new FormData(form)

    fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
    })
        .then(response => {
            if (!response.ok) {
                form.innerHTML = `<h1 id='error'>Oops! We Encountered An Error. <br>Please Try Again Later</h1>`
            } else {
                form.innerHTML = `<h1 id='success'>Thank you for contacting us. <br> Our Team Will Get Back To You Shortly</h1>`
            }
        })
        .catch(error => {
            form.innerHTML = `<h1 id='error' >Oops! We Encountered An Error. <br>Please Try Again Later</h1>`
        })
}

document.querySelector("form").addEventListener("submit", submitAjaxForm);