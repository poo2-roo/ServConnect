from io import BytesIO
from PIL import Image, ImageEnhance, ImageOps


def ameliorer_image_bytes(image_bytes: bytes) -> bytes:
    """Ameliore une image (contraste, nettete, saturation) et renvoie les octets JPEG resultants."""
    image = Image.open(BytesIO(image_bytes)).convert('RGB')
    image = ImageOps.autocontrast(image, cutoff=1)
    image = ImageEnhance.Sharpness(image).enhance(1.3)
    image = ImageEnhance.Color(image).enhance(1.15)
    image = ImageEnhance.Brightness(image).enhance(1.05)

    tampon = BytesIO()
    image.save(tampon, format='JPEG', quality=90)
    return tampon.getvalue()
