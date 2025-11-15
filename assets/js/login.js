document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (email === "" || password === "") {
            alert("Todos los campos son obligatorios");
            return;
        }

        // Ejemplo para backend real:
        /*
        const response = await fetch("http://tu-api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        */

        // Simulación temporal sin backend:
        const data = {
            ok: true,
            usuario: {
                id: 1,
                nombre: "Usuario Demo",
                email: email
            }
        };

        if (data.ok) {
            localStorage.setItem("usuario", JSON.stringify(data.usuario));
            alert("Inicio de sesión exitoso");
            window.location.href = "parqueos.html";
        } else {
            alert("Credenciales incorrectas");
        }
    });
});
