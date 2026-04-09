// Flash message auto hide
setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => alert.remove(), 400);
    });
}, 5000);

// Auth tab toggling
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.form-toggle');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    if(tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

// Form validation helpers
function validateLogin() {
    return true; // Browser builtin checks required formats easily
}

function validateRegister() {
    const pw = document.getElementById('reg-password').value;
    if(pw.length < 4) {
        alert("Password must be at least 4 characters long.");
        return false;
    }
    return true;
}

function validateSubmit() {
    const loc = document.getElementById('location').value;
    if(!loc) {
        document.getElementById('location-hint').style.display = 'block';
        return false;
    }
    return true;
}

// Leaflet Map Initialization
document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');
    if (mapElement && typeof L !== 'undefined') {
        // Default map position
        const map = L.map('map').setView([20.5937, 78.9629], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        let currentMarker = null;
        
        // Try getting user's actual location if permitted
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 13);
            }, () => {
                console.log("Geolocation not available or denied.");
            });
        }

        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            if (currentMarker) map.removeLayer(currentMarker);
            
            currentMarker = L.marker([lat, lng]).addTo(map);
            document.getElementById('location').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            document.getElementById('location-hint').style.display = 'none';
        });
    }
});

// Admin Status Updates
function updateStatus(complaintId, status) {
    if(!confirm("Are you sure you want to update the status to " + status + "?")) return;
    
    fetch(`/api/status/${complaintId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            window.location.reload();
        } else {
            alert("Error updating status: " + data.error);
        }
    })
    .catch(error => console.error('Error:', error));
}
