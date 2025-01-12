document.addEventListener("DOMContentLoaded", () => {
    const reviewCards = document.querySelectorAll(".review-card");
  
    reviewCards.forEach((card) => {
      card.addEventListener("click", () => {
        const eventTitle = card.querySelector(".event-title").innerText;
        alert(`You clicked on the review for ${eventTitle}`);
      });
    });
  });
  