const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Submitting...";

  const data = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    password: form.elements.password.value
  };

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const text = await res.text();
    msg.textContent = res.ok ? `✅ ${text}` : `❌ ${text}`;
    if (res.ok) form.reset();
  } catch (err) {
    msg.textContent = `❌ Network error: ${err.message}`;
  }
});
