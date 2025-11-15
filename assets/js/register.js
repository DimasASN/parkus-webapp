document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value.trim();
        const password2 = document.getElementById("password2").value.trim();

        if (!name || !email || !phone || !password || !password2) {
            alert("Todos los campos son obligatorios");
            return;
        }

        if (password !== password2) {
            alert("Las contraseñas no coinciden");
            return;
        }

        // Conexión real a backend (cuando lo tengas):
        /*
        const response = await fetch("http://tu-api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, password })
        });
        const data = await response.json();
        */

        // Simulación temporal sin backend:
        const data = {
            ok: true,
            message: "Usuario creado",
            usuario: { id: Date.now(), name, email }
        };

        if (data.ok) {
            alert("Registro exitoso. Ahora puedes iniciar sesión.");
            window.location.href = "login.html";
        } else {
            alert("Error al registrar usuario");
        }
    });
});
