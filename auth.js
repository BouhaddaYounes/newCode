// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
    return token;
  }
  
  // Login form handler
  if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
  
        try {
            const response = await fetch('http://localhost:5501/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
  
            const data = await response.json();
  
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                window.location.href = 'index.html';
            } else {
                document.getElementById('error-message').textContent = data.message || 'Login failed';
            }
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('error-message').textContent = 'An error occurred while trying to log in';
        }
    });
  }
  
  // Signup form handler
  if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
  
        if (password !== confirmPassword) {
            document.getElementById('error-message').textContent = 'Passwords do not match';
            return;
        }
  
        try {
            const response = await fetch('http://localhost:5501/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
  
            const data = await response.json();
  
            if (data.success) {
                window.location.href = 'login.html';
            } else {
                document.getElementById('error-message').textContent = data.message || 'Signup failed';
            }
        } catch (error) {
            document.getElementById('error-message').textContent = 'An error occurred';
        }
    });
  }