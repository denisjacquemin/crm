// Select all input/button elements with type attribute equals to submit
const submitButtons = document.querySelectorAll("input[type='submit'], button[type='submit']");
// Loop through all submit buttons
submitButtons.forEach(button => {
    // Add a click event listener to each button
    button.addEventListener("click", () => {
        // Add the opacity-50 and pointer-events-none classes to the button, disabling it
        button.classList.add("opacity-50", "pointer-events-none");
        // change the text of the button to loading
        // assign button.innerText with button data-disbaled-text attribute
        button.innerText = button.dataset.disabledText;
        // disabling the button
        button.disabled = true;
        // submiting form
        button.form.submit();
    });
});