const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");

if (!context) {
  throw new Error("Webbläsaren kan inte skapa en 2D-canvas.");
}

context.fillStyle = "#192630";
context.fillRect(0, 0, canvas.width, canvas.height);
context.fillStyle = "#f2f5f7";
context.textAlign = "center";
context.textBaseline = "middle";
context.font = "24px system-ui, sans-serif";
context.fillText("Spelet börjar här", canvas.width / 2, canvas.height / 2);
