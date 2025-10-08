const ghProxy = "https://cdn.jsdelivr.net/gh/gingerphoenix10/Mania@main/";

const setlist = [
  "Clinozoisite",
  "Hello (BPM) 2024",
  "Aegleseeker",
  "Supernovae",
  "Soulless 5",
  "Cyb-B",
  "Rhythmic Maniac",
  "Explumbergation",
  "LoveShot",
  "terMANIAtion"
];

for (var song of setlist) {
  var songUrl = `${ghProxy}${song}/chart.js`;
  var tag = document.createElement("script");
  tag.src = songUrl;
  document.body.appendChild(tag);
}
