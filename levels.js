const header = "https://cdn.jsdelivr.net/gh/gingerphoenix10/Mania@main/"

const setlist = [
  "Supernovae",
  "Soulless5"
]

for (var song of setlist) {
  var songUrl = `${header}${song}.js`;
  var tag = document.createElement("script");
  tag.src = songUrl;
  document.body.appendChild(tag);
}
