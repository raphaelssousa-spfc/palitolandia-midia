from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import sys
HAT_ANG=float(sys.argv[1]) if len(sys.argv)>1 else 30
HAT_OFF=float(sys.argv[2]) if len(sys.argv)>2 else 0.86

W, H = 1080, 1350
NAVY = (12, 38, 72)
NAVY2 = (18, 52, 96)
GRID = (40, 78, 125)
GRID2 = (28, 62, 105)
WHITE = (255, 255, 255)
YEL = (255, 196, 0)
YEL_D = (222, 160, 0)
LIGHT = (170, 200, 235)

POP_B = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
INTER_B = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
INTER_M = "/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf"
INTER_XB = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"

img = Image.new("RGB", (W, H), NAVY)
d = ImageDraw.Draw(img)

# vertical gradient
for y in range(H):
    t = y / H
    c = tuple(int(NAVY2[i] * (1 - t) + NAVY[i] * t) for i in range(3))
    d.line([(0, y), (W, y)], fill=c)

# blueprint grid
for x in range(0, W, 30):
    d.line([(x, 0), (x, H)], fill=GRID2, width=1)
for y in range(0, H, 30):
    d.line([(0, y), (W, y)], fill=GRID2, width=1)
for x in range(0, W, 150):
    d.line([(x, 0), (x, H)], fill=GRID, width=2)
for y in range(0, H, 150):
    d.line([(0, y), (W, y)], fill=GRID, width=2)


def center_text(y, text, font, fill):
    bb = d.textbbox((0, 0), text, font=font)
    w = bb[2] - bb[0]
    d.text(((W - w) / 2 - bb[0], y), text, font=font, fill=fill)
    return bb[3] - bb[1]


# date pill
f_pill = ImageFont.truetype(INTER_XB, 40)
txt = "11 DE DEZEMBRO"
bb = d.textbbox((0, 0), txt, font=f_pill)
pw, ph = bb[2] - bb[0] + 70, 78
px, py = (W - pw) / 2, 70
d.rounded_rectangle([px, py, px + pw, py + ph], radius=39, fill=YEL)
d.text((px + 35 - bb[0], py + (ph - (bb[3] - bb[1])) / 2 - bb[1]), txt, font=f_pill, fill=NAVY)

# title
f_small = ImageFont.truetype(POP_B, 70)
f_big = ImageFont.truetype(POP_B, 132)
center_text(180, "DIA DO", f_small, WHITE)
center_text(250, "ENGENHEIRO", f_big, YEL)

# ---- illustration: arch bridge ----
base_y = 960
left, right = 90, W - 90
deck_y = 820
# piers
d.rectangle([left, deck_y, left + 40, base_y], fill=WHITE)
d.rectangle([right - 40, deck_y, right, base_y], fill=WHITE)
# arch
cx = W / 2
span = (right - 22) - (left + 40)
rise = 230
pts = []
for i in range(0, 101):
    t = i / 100
    x = (left + 40) + span * t
    y = base_y - rise * (1 - (2 * t - 1) ** 2)
    pts.append((x, y))
d.line(pts, fill=YEL, width=14, joint="curve")
# hangers
for i in range(1, 12):
    t = i / 12
    x = (left + 40) + span * t
    y = base_y - rise * (1 - (2 * t - 1) ** 2)
    if y > deck_y + 8:
        d.line([(x, deck_y + 16), (x, y)], fill=LIGHT, width=6)
    else:
        d.line([(x, y), (x, deck_y)], fill=LIGHT, width=6)
# deck
d.rectangle([left - 20, deck_y - 6, right + 20, deck_y + 18], fill=WHITE)
# road dashes on deck
for x in range(left, right, 60):
    d.line([(x, deck_y + 6), (x + 30, deck_y + 6)], fill=NAVY, width=4)
# water lines
for k, yy in enumerate(range(base_y + 15, base_y + 70, 22)):
    off = (k % 2) * 40
    for x in range(-40 + off, W, 110):
        d.arc([x, yy, x + 60, yy + 20], 200, 340, fill=LIGHT, width=4)

# dimension line (cota) over the arch
dy = 650
d.line([(left + 40, dy), (W/2 - 160, dy)], fill=LIGHT, width=3)
d.line([(W/2 + 160, dy), (right - 40, dy)], fill=LIGHT, width=3)
for x in (left + 40, right - 22):
    d.line([(x, dy - 18), (x, dy + 18)], fill=LIGHT, width=3)
    d.line([(x - 12, dy + 12), (x + 12, dy - 12)], fill=LIGHT, width=3)

# emoji 🤣 com capacete branco (montado junto)
import math as _m
EMO = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
fe = ImageFont.truetype(EMO, 109)
em = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
ImageDraw.Draw(em).text((8, 8), "\U0001F923", font=fe, embedded_color=True)
em = em.crop(em.getbbox())
S = 170
em = em.resize((S, int(S * em.height / em.width)), Image.LANCZOS)

ANG = HAT_ANG
R = S * 0.47                      # raio da cara
grp = Image.new("RGBA", (420, 420), (0, 0, 0, 0))
gcx, gcy = 210, 250               # centro da cara no grupo
grp.paste(em, (int(gcx - em.width / 2), int(gcy - em.height / 2)), em)

HAT_W = (252, 252, 252)
HAT_S = (196, 202, 212)
hat = Image.new("RGBA", (400, 300), (0, 0, 0, 0))
hd = ImageDraw.Draw(hat)
hcx, hby = 200, 180               # centro da aba
dr = R * 0.80                     # cúpula
hd.pieslice([hcx - dr, hby - dr * 1.05, hcx + dr, hby + dr * 0.95], 180, 360, fill=HAT_W, outline=HAT_S, width=3)
hd.rounded_rectangle([hcx - 12, hby - dr * 1.05 - 6, hcx + 12, hby - 6], radius=9, fill=HAT_S)
bw = R * 1.12                     # meia-aba
hd.rounded_rectangle([hcx - bw, hby - 8, hcx + bw, hby + 14], radius=11, fill=HAT_S)
hat = hat.rotate(ANG, center=(hcx, hby), resample=Image.BICUBIC)
# vetor "pra cima" da cara (girado ANG graus anti-horário)
ux, uy = -_m.sin(_m.radians(ANG)), -_m.cos(_m.radians(ANG))
off = R * HAT_OFF
bx, by_ = gcx + ux * off, gcy + uy * off
grp.paste(hat, (int(bx - hcx), int(by_ - hby)), hat)
grp = grp.crop(grp.getbbox())
gx = int(W / 2 - grp.width / 2)
gy = int(dy - 12 - grp.height)
img.paste(grp, (gx, gy), grp)
grp.save("/home/claude/grp.png")
d = ImageDraw.Draw(img)

# ---- comic touches ----
COMIC = "/usr/share/fonts/truetype/google-fonts/ofl/comicrelief/ComicRelief-Bold.ttf"
RED = (255, 99, 88)
WOOD = (176, 116, 62)
WOOD_D = (128, 80, 40)
# cota label "medido no olho"
f_note = ImageFont.truetype(COMIC, 34)
center_text(dy + 22, "≈ 40 m (medido no olho)", f_note, LIGHT)

# escora de madeira improvisada segurando o meio da ponte
ex = W / 2 - 10
esc = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ed = ImageDraw.Draw(esc)
ed.rectangle([ex - 14, deck_y + 18, ex + 14, base_y + 12], fill=WOOD, outline=WOOD_D, width=3)
for yy in range(deck_y + 40, base_y, 34):
    ed.line([(ex - 8, yy), (ex + 6, yy + 10)], fill=WOOD_D, width=2)
# cunha (wedge) em cima
ed.polygon([(ex - 26, deck_y + 18), (ex + 26, deck_y + 18), (ex + 26, deck_y + 30)], fill=WOOD_D)
esc = esc.rotate(-4, center=(ex, base_y), resample=Image.BICUBIC)
img.paste(esc, (0, 0), esc)
d = ImageDraw.Draw(img)

# fita silver tape em X no arco (lado esquerdo)
t = 0.2
tx = (left + 40) + span * t
ty = base_y - rise * (1 - (2 * t - 1) ** 2)
tape = Image.new("RGBA", (W, H), (0, 0, 0, 0))
td = ImageDraw.Draw(tape)
for ang in (35, -35):
    piece = Image.new("RGBA", (90, 26), (190, 196, 204, 255))
    pd = ImageDraw.Draw(piece)
    for k in range(0, 90, 9):
        pd.line([(k, 0), (k, 26)], fill=(160, 166, 176, 255), width=1)
    piece = piece.rotate(ang, expand=True, resample=Image.BICUBIC)
    tape.paste(piece, (int(tx - piece.width / 2), int(ty - piece.height / 2)), piece)
img.paste(tape, (0, 0), tape)
d = ImageDraw.Draw(img)

# bilhete escrito à mão apontando pra escora
f_hand = ImageFont.truetype(COMIC, 36)
note_x, note_y = ex + 70, deck_y + 52
d.text((note_x, note_y), "ajuste de", font=f_hand, fill=RED)
d.text((note_x, note_y + 40), "projeto", font=f_hand, fill=RED)
# seta curva até a escora
arrow = [(note_x - 8, note_y + 30), (note_x - 30, note_y + 40), (ex + 22, note_y + 52)]
d.line(arrow, fill=RED, width=5, joint="curve")
d.polygon([(ex + 18, note_y + 52), (ex + 38, note_y + 40), (ex + 36, note_y + 64)], fill=RED)

# tagline
f_tag = ImageFont.truetype(INTER_B, 52)
f_tag2 = ImageFont.truetype(INTER_M, 40)
center_text(1075, "Feliz dia pra quem resolve na obra", f_tag, WHITE)
center_text(1140, "o que não cabia no projeto.", f_tag, WHITE)

# footer
f_foot = ImageFont.truetype(INTER_B, 36)
center_text(1255, "@eng.raphaelserra", f_foot, YEL)

img.save("/home/claude/dia-do-engenheiro.jpg", "JPEG", quality=92)
print("ok")
