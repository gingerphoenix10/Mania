const ghProxy = "https://cdn.jsdelivr.net/gh/gingerphoenix10/Mania@main/";

const setlist = [
  "Supernovae",
  "Soulless 5"
];

for (var song of setlist) {
  var songUrl = `${ghProxy}${song}/chart.js`;
  var tag = document.createElement("script");
  tag.src = songUrl;
  document.body.appendChild(tag);
}
