const indices = [
    { lat: 45.123, lng: 5.456, texte: "En voiture Simone, direction McDonald's Voreppe." },
    { lat: 45.123, lng: 5.456, texte: "Sortie 10 tu prendras." },
    { lat: 45.789, lng: 5.654, texte: "Tu es sur la bonne voie ! Rends-toi à la bibliothèque." },
];

let foundIndices = [];

// Initialisation de la carte
const map = L.map('map').setView([45.1885, 5.7245], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Marqueurs pour les indices
indices.forEach(indice => {
    L.marker([indice.lat, indice.lng]).addTo(map)
        .bindPopup(indice.texte)
        .on('click', () => {
            document.getElementById('current-indice').textContent = indice.texte;
        });
});

// Fonction pour calculer la distance
function calculerDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Fonction pour obtenir un indice
function obtenirIndice(lat, lng) {
    for (const indice of indices) {
        const distance = calculerDistance(lat, lng, indice.lat, indice.lng);
        if (distance < 0.1) {
            if (!foundIndices.some(i => i.texte === indice.texte)) {
                foundIndices.push(indice);
                afficherIndicesTrouves();
            }
            return indice.texte;
        }
    }
    return "Tu n'es pas encore près d'un indice. Continue à chercher !";
}

// Afficher les indices trouvés
function afficherIndicesTrouves() {
    const list = document.getElementById('indices-list');
    list.innerHTML = '';
    foundIndices.forEach(indice => {
        const item = document.createElement('div');
        item.className = 'indice-item';
        item.textContent = indice.texte;
        list.appendChild(item);
    });
}

// Afficher la position
function afficherPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const indice = obtenirIndice(lat, lng);
    document.getElementById('current-indice').textContent = indice;
    map.setView([lat, lng], 15);
    L.marker([lat, lng]).addTo(map)
        .bindPopup("Tu es ici !")
        .openPopup();
    arreterChargement();
}

// Afficher une erreur
function afficherErreur(erreur) {
    let messageErreur;
    switch(erreur.code) {
        case erreur.PERMISSION_DENIED:
            messageErreur = "L'utilisateur a refusé la demande de géolocalisation.";
            break;
        case erreur.POSITION_UNAVAILABLE:
            messageErreur = "Les informations de localisation ne sont pas disponibles.";
            break;
        case erreur.TIMEOUT:
            messageErreur = "La demande de géolocalisation a expiré.";
            break;
        case erreur.UNKNOWN_ERROR:
            messageErreur = "Une erreur inconnue s'est produite.";
            break;
    }
    document.getElementById('current-indice').textContent = messageErreur;
    arreterChargement();
}

// Démarrer le chargement
function demarrerChargement() {
    document.getElementById('search-text').classList.add('hidden');
    document.getElementById('loading-spinner').classList.remove('hidden');
}

// Arrêter le chargement
function arreterChargement() {
    document.getElementById('search-text').classList.remove('hidden');
    document.getElementById('loading-spinner').classList.add('hidden');
}

// Recherche manuelle
document.getElementById('search-btn').addEventListener('click', () => {
    demarrerChargement();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(afficherPosition, afficherErreur);
    } else {
        document.getElementById('current-indice').textContent = "La géolocalisation n'est pas supportée par ton navigateur.";
        arreterChargement();
    }
});

// Recherche automatique au chargement
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(afficherPosition, afficherErreur);
} else {
    document.getElementById('current-indice').textContent = "La géolocalisation n'est pas supportée par ton navigateur.";
}
