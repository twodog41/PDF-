from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "public" / "icons"
STORE_DIR = ROOT / "store-assets"
ICON_DIR.mkdir(parents=True, exist_ok=True)
STORE_DIR.mkdir(parents=True, exist_ok=True)

BLUE = "#155EEF"
BLUE_DARK = "#0B3FA7"
GREEN = "#16A474"
INK = "#10203D"
PALE = "#EAF1FF"


def font(size: int, bold: bool = False):
    candidates = [
        Path("C:/Windows/Fonts/msyhbd.ttc" if bold else "C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def draw_logo(size: int, padding_ratio: float = 0.125):
    scale = 4
    image = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    p = int(size * scale * padding_ratio)
    unit = size * scale
    draw.rounded_rectangle((p, p, unit - p, unit - p), radius=int(unit * .19), fill=BLUE)
    x0, y0, x1, y1 = int(unit*.31), int(unit*.22), int(unit*.72), int(unit*.79)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=int(unit*.04), fill="white")
    fold = int(unit*.13)
    draw.polygon([(x1-fold, y0), (x1, y0+fold), (x1-fold, y0+fold)], fill="#BDD1FF")
    for y, width in ((.46, .22), (.55, .27)):
        draw.rounded_rectangle((int(unit*.39), int(unit*y), int(unit*(.39+width)), int(unit*(y+.035))), radius=int(unit*.018), fill="#8DADFA")
    cx, cy, r = int(unit*.62), int(unit*.65), int(unit*.125)
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=GREEN, outline="white", width=max(2, int(unit*.025)))
    draw.line((cx-int(r*.46), cy, cx-int(r*.1), cy+int(r*.35), cx+int(r*.52), cy-int(r*.42)), fill="white", width=max(2, int(unit*.035)), joint="curve")
    return image.resize((size, size), Image.Resampling.LANCZOS)


for size in (16, 32, 48, 128):
    draw_logo(size).save(ICON_DIR / f"icon-{size}.png")

draw_logo(300).save(STORE_DIR / "logo-300x300.png")


def promo(width: int, height: int, path: Path, include_text: bool):
    image = Image.new("RGB", (width, height), BLUE_DARK)
    draw = ImageDraw.Draw(image)
    for index in range(12):
        inset = index * max(1, width // 200)
        color = (18 + index, 70 + index * 2, 175 + index * 4)
        draw.rounded_rectangle((inset, inset, width-inset, height-inset), radius=height//10, outline=color)
    logo_size = int(height * .50)
    logo = draw_logo(logo_size, .04)
    image.paste(logo, (int(width*.11), (height-logo_size)//2), logo)
    for offset, alpha in ((0, 255), (1, 220), (2, 190)):
        x = int(width * (.58 + offset * .055))
        y = int(height * (.22 + offset * .08))
        w, h = int(width*.22), int(height*.58)
        draw.rounded_rectangle((x, y, x+w, y+h), radius=height//28, fill=(239-offset*8, 244-offset*5, 255), outline="#8FAEF5", width=max(1, width//440))
        draw.line((x+w*.2, y+h*.35, x+w*.8, y+h*.35), fill="#8FAEF5", width=max(2, width//220))
        draw.line((x+w*.2, y+h*.48, x+w*.67, y+h*.48), fill="#B0C4F5", width=max(2, width//220))
    if include_text:
        draw.text((int(width*.27), int(height*.34)), "PDF小匠", font=font(int(height*.12), True), fill="white")
        draw.text((int(width*.27), int(height*.53)), "LOCAL · PRIVATE · OPEN", font=font(int(height*.035), True), fill="#BFD0FF")
    image.save(path, quality=95)


promo(440, 280, STORE_DIR / "promo-small-440x280.png", False)
promo(1400, 560, STORE_DIR / "promo-marquee-1400x560.png", True)
print("Generated extension icons and store promo assets.")
