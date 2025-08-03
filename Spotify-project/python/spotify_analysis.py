# python/spotify_analysis.py
import spotipy
from spotify.oauth2 import SpotifyOAuth

def main():
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id='fde7f90fa6644afb8ddf18b76d304458',
        client_secret='7fcfef91a2924817a0b0c68c3e824ff6',
        redirect_uri='https://abcd1234.ngrok.io/callback',
        scope='user-library-read user-top-read'
    ))

    results = sp.current_user_top_tracks(limit=10)
    for idx, item in enumerate(results['items']):
        print(f"{idx + 1}. {item['name']} by {item['artists'][0]['name']}")

if __name__ == '__main__':
    main()
