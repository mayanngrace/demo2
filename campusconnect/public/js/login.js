async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const err = document.getElementById("errorAlert");

  err.style.display = "none";

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    window.location.href = "/";
  } else {
    err.style.display = "block";
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});