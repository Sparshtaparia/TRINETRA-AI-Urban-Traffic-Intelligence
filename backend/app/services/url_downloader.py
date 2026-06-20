import os
import re
import requests

def get_direct_url(url: str) -> str:
    """
    Converts a Google Drive sharing URL or Dropbox URL to a direct download URL.
    Returns the original URL if no matching pattern is found.
    """
    # Match Google Drive file ID
    gdrive_match = re.search(r'drive\.google\.com/file/d/([^/]+)', url)
    if not gdrive_match:
        gdrive_match = re.search(r'drive\.google\.com/open\?id=([^&]+)', url)
    
    if gdrive_match:
        file_id = gdrive_match.group(1)
        return f"https://drive.google.com/uc?export=download&id={file_id}"
    
    # Match Dropbox URL
    if "dropbox.com" in url:
        return url.replace("dl=0", "dl=1")
        
    return url

def guess_extension_from_magic_bytes(header: bytes) -> str:
    """
    Reads the first few bytes of a file to guess the extension.
    Falls back to .csv if unknown.
    """
    if header.startswith(b'PAR1'):
        return '.parquet'
    if header.startswith(b'PK\x03\x04'):
        return '.xlsx'
    
    # Check for common zip headers if people zip their csv
    if header.startswith(b'PK'):
        return '.zip'
        
    return '.csv'

def download_from_url(url: str) -> tuple[bytes, str]:
    """
    Downloads a file from a URL.
    Returns a tuple of (file_contents, detected_extension).
    """
    direct_url = get_direct_url(url)
    
    # Some basic headers to mimic a browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(direct_url, headers=headers, stream=True)
    response.raise_for_status()
    
    # Read the first chunk to detect magic bytes
    iterator = response.iter_content(chunk_size=8192)
    try:
        first_chunk = next(iterator)
    except StopIteration:
        first_chunk = b""
        
    extension = guess_extension_from_magic_bytes(first_chunk[:10])
    
    # Read the rest of the file
    content_chunks = [first_chunk]
    for chunk in iterator:
        if chunk:
            content_chunks.append(chunk)
            
    return b"".join(content_chunks), extension
