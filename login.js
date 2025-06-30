document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value.toLowerCase(); // normalize
  const errorMsg = document.getElementById('login-error');

  axios.post('http://localhost:4000/api/login',
    { username, password, role },
    { headers: { 'Content-Type': 'application/json' } }
  )
    .then(res => {
      const data = res.data;

      if (data.token) {
        errorMsg.style.color = "#228B22";
        errorMsg.textContent = "Login successful! Redirecting...";

        localStorage.setItem('authToken', data.token);

        if (role === "student" && data.student) {
  localStorage.setItem('studentId', data.student.id);
} else if (role === "faculty" && data.faculty) {
  localStorage.setItem('facultyId', data.faculty.id);
} else if (role === "admin" && data.admin) {
  localStorage.setItem('adminId', data.admin.id);
}

        setTimeout(() => {
  if (role === "student") window.location.href = "student.html";
  else if (role === "faculty") window.location.href = "faculty.html";
  else if (role === "admin") window.location.href = "admin.html";
}, 1000);

      } else {
        errorMsg.style.color = "#a52a2a";
        errorMsg.textContent = data.error || "Login failed";
      }
    })
    .catch(err => {
      console.error("❌ Login Error:", err);
      errorMsg.style.color = "#a52a2a";
      errorMsg.textContent = err.response?.data?.error || "Invalid credentials or role";
    });
});
