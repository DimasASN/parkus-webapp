// Mostrar opciones si el usuario ya está logueado
document.addEventListener("DOMContentLoaded", () => {
    const usuario = localStorage.getItem("usuario");

    if (usuario) {
        console.log("Usuario logueado:", JSON.parse(usuario));

        const links = document.querySelector(".quick-links");
        links.innerHTML = `
            <a href="parqueos.html" class="btn-primary">Ir a Parqueaderos</a>
            <a href="#" id="logoutBtn" class="btn-secondary">Cerrar sesión</a>
        `;

        document.getElementById("logoutBtn").addEventListener("click", () => {
            localStorage.removeItem("usuario");
            location.reload();
        });
    }
});
