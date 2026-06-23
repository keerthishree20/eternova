"use client";

function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export default function SpotifyEmbed({ url }: { url: string }) {
  const trackId = extractSpotifyTrackId(url);
  if (!trackId) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-green-500 hover:underline">
        🎵 Listen on Spotify
      </a>
    );
  }
  return (
    <iframe
      src={`https://open.spotify.com/embed/track/${trackId}?theme=0`}
      width="100%"
      height="80"
      allow="encrypted-media"
      className="rounded-xl"
      loading="lazy"
    />
  );
}
