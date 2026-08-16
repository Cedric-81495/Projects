"""Build the two brand assets the layout needs, in the roles p.5 and p.7 assign them.

  MARK   Gwop_University_logo.png  → nav, footer, event bar, favicons
         Clean shield. Legible at 34px, which the ornate artwork is not.

  HERO   Primary-logo-w-bg.jpeg    → the image on the right of the black card
         This is what appears in the package on p.5 and p.7.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

PUB = '/home/claude/work/gwop/public'
APP = '/home/claude/work/gwop/src/app'


def trim(im):
    return im.crop(im.getbbox())


# ═══ 1 · MARK — already transparent, just trim and resize ════════════════════
mark = trim(Image.open('/mnt/user-data/uploads/Gwop_University_logo.png').convert('RGBA'))
print('mark trimmed:', mark.size)

for w in (512, 256, 128, 64):
    r = mark.resize((w, w), Image.LANCZOS)
    r.save(f'{PUB}/mark-{w}.png', optimize=True)
    r.save(f'{PUB}/mark-{w}.webp', quality=92, method=6)

# Favicons + Apple touch icon. Next.js serves these from src/app automatically.
mark.resize((512, 512), Image.LANCZOS).save(f'{APP}/icon.png', optimize=True)
# Apple icons get a solid plate — iOS does not composite transparency, it shows black.
plate = Image.new('RGBA', mark.size, (247, 243, 233, 255))   # ivory
plate.alpha_composite(mark)
plate.resize((180, 180), Image.LANCZOS).convert('RGB').save(
    f'{APP}/apple-icon.png', optimize=True)
print('favicons written')


# ═══ 2 · HERO — cut the white background off the ornate artwork ══════════════
# Interior white marble must survive, so remove only white CONNECTED to the border.
src = Image.open('/mnt/user-data/uploads/Primary-logo-w-bg.jpeg').convert('RGB')
a = np.array(src).astype(np.int16)
whiteish = (a.min(axis=2) >= 236) & (a.max(axis=2) - a.min(axis=2) <= 14)

labels, _ = ndimage.label(whiteish)
edge = {*labels[0, :], *labels[-1, :], *labels[:, 0], *labels[:, -1]} - {0}
bg = np.isin(labels, list(edge))
print(f'background removed: {bg.mean() * 100:.1f}% of the frame')

al = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
al = al.filter(ImageFilter.MinFilter(3))          # pull in 1px, kills the JPEG halo
al = al.filter(ImageFilter.GaussianBlur(0.6))     # anti-alias the cut

hero = trim(Image.fromarray(np.dstack([np.array(src), np.array(al)]), 'RGBA'))
h, w = hero.height, hero.width
core = np.array(hero)[h // 2 - 200:h // 2 + 200, w // 2 - 200:w // 2 + 200, 3]
print(f'hero trimmed: {hero.size} · centre opacity {(core > 200).mean() * 100:.0f}%')

for wid in (900, 600, 400):
    r = hero.resize((wid, round(hero.height * wid / hero.width)), Image.LANCZOS)
    r.save(f'{PUB}/hero-crest-{wid}.png', optimize=True)
    # Event page runs on venue cellular, so the small variant is compressed harder
    r.save(f'{PUB}/hero-crest-{wid}.webp',
           quality=90 if wid > 400 else 82, method=6)
    print(f'  {wid}px → {r.size}')

print('\nnative hero ratio', round(hero.width / hero.height, 4))
