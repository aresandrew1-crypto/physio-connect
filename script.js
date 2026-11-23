
const bookingForm = document.getElementById("bookingForm");
const physioForm = document.getElementById("physioForm");
const dateInput = document.getElementById("date");

// Prevent choosing a date in the past.
const today = new Date();
const localDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

dateInput.min = localDate;

bookingForm.addEventListener("submit", function(event) {
  event.preventDefault();

  document.getElementById("bookingMessage").textContent =
    "Demo successful! No real appointment was booked.";

  bookingForm.reset();
});

physioForm.addEventListener("submit", function(event) {
  event.preventDefault();

  document.getElementById("physioMessage").textContent =
    "Demo successful! No registration was submitted.";

  physioForm.reset();
});
