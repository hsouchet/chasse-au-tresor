const indices = [ 
    { lat: 45.15184260231581, lng: 5.7015055686360085, texte: "<img src='https://raw.githubusercontent.com/hsouchet/chasse-au-tresor/main/images/indice_1.png' alt='Indice 1' style='max-width:100%; height:auto;' />" },
    { lat: 45.355198, lng: 5.591622, texte: "Sortie 10 tu prendras." },
    { lat: 45.789, lng: 5.654, texte: "Tu es sur la bonne voie ! Rends-toi à la bibliothèque." },
];

let foundIndices = [];
let markers = [];
let userMarker = null;

// Icônes personnalisées
const userIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const indiceIcon = L.divIcon({
    className: 'indice-icon',
    html: '📍', 
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

// Initialisation de la carte
const map = L.map('map').setView([45.1885, 5.7245], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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
                const marker = L.marker([indice.lat, indice.lng], { icon: indiceIcon }).addTo(map)
                    .bindPopup(indice.texte)
                    .on('click', () => {
                        document.getElementById('current-indice').innerHTML = indice.texte;
                    });
                markers.push(marker);
                afficherIndicesTrouves();
            }
            return indice.texte;
        }
    }
    return "Tu n'es pas encore près d'un indice. Continue à chercher !";
}

// Afficher les indices trouvés avec mini-cartes
function afficherIndicesTrouves() {
    const list = document.getElementById('indices-list');
    list.innerHTML = '';
    foundIndices.forEach(indice => {
        const item = document.createElement('div');
        item.className = 'indice-item';

        const text = document.createElement('div');
        text.innerHTML = indice.texte;
        item.appendChild(text);

        const miniMapDiv = document.createElement('div');
        miniMapDiv.className = 'mini-map';
        miniMapDiv.id = `mini-map-${indice.lat}-${indice.lng}`;
        item.appendChild(miniMapDiv);

        list.appendChild(item);

        setTimeout(() => {
            const miniMap = L.map(miniMapDiv).setView([indice.lat, indice.lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(miniMap);
            L.marker([indice.lat, indice.lng], { icon: indiceIcon }).addTo(miniMap)
                .bindPopup(indice.texte)
                .openPopup();
            miniMap.invalidateSize();
        }, 100);
    });
}

// Gestion du volet roulant
document.querySelector('.toggle-title').addEventListener('click', () => {
    const content = document.getElementById('indices-list');
    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
        content.classList.remove('hidden');
        content.classList.add('visible');
        document.querySelector('.toggle-title').textContent = 'Indices trouvés ▲';
    } else {
        content.classList.remove('visible');
        content.classList.add('hidden');
        document.querySelector('.toggle-title').textContent = 'Indices trouvés ▼';
    }
});

// Afficher la position
function afficherPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map)
        .bindPopup("Tu es ici !")
        .openPopup();

    map.setView([lat, lng], 15);
    const indice = obtenirIndice(lat, lng);
    document.getElementById('current-indice').textContent = indice;
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

// Démarrer/arrêter le chargement
function demarrerChargement() {
    document.getElementById('search-text').classList.add('hidden');
    document.getElementById('loading-spinner').classList.remove('hidden');
}

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
