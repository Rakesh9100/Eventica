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
                form.innerHTML = `<h1 id='error'>Oops! We encountered an error. <br>Please try again later.</h1>`
            } else {
                form.innerHTML = `<h1 id='success'>Thanks for reaching out! <br>I will get back to you shortly.</h1>`
            }
        })
        .catch(error => {
            form.innerHTML = `<h1 id='error'>Oops! We encountered an error. <br>Please try again later.</h1>`
        })
}

document.querySelector("form").addEventListener("submit", submitAjaxForm);