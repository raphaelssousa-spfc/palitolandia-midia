from PIL import Image, ImageDraw, ImageFont
import math, os

W, H = 1000, 1500
GF = "/usr/share/fonts/truetype/google-fonts/"
CREAM = (253, 247, 232)
YELLOW = (245, 193, 46)
SAGE = (138, 160, 120)
DSAGE = (70, 92, 62)
INK = (45, 42, 38)
WHITE = (255, 255, 255)
TOMATO = (214, 90, 60)

def lora(size, weight="Bold"):
    f = ImageFont.truetype(GF + "Lora-Variable.ttf", size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f

def pop(size, w="Bold"):
    return ImageFont.truetype(GF + f"Poppins-{w}.ttf", size)

def center(d, y, text, font, fill):
    w = d.textlength(text, font=font)
    d.text(((W - w) / 2, y), text, font=font, fill=fill)

def daisy(d, cx, cy, r, petal=WHITE, mid=YELLOW):
    for i in range(12):
        a = i * math.pi / 6
        px, py = cx + math.cos(a) * r * 0.62, cy + math.sin(a) * r * 0.62
        d.ellipse([px - r * 0.38, py - r * 0.38, px + r * 0.38, py + r * 0.38], fill=petal)
    d.ellipse([cx - r * 0.38, cy - r * 0.38, cx + r * 0.38, cy + r * 0.38], fill=mid)

# ---------- icons (drawn in a 420x420 box centered at cx,cy) ----------
def icon_plate(d, cx, cy):
    d.ellipse([cx-200, cy-200, cx+200, cy+200], fill=WHITE, outline=(230, 222, 200), width=6)
    d.ellipse([cx-140, cy-140, cx+140, cy+140], fill=(250, 244, 228))
    # food: chicken (brown blobs), potatoes (yellow), beans (green)
    for (x, y) in [(-50, -40), (40, -60)]:
        d.ellipse([cx+x-55, cy+y-38, cx+x+55, cy+y+38], fill=(196, 120, 60))
        d.ellipse([cx+x-40, cy+y-28, cx+x+30, cy+y+10], fill=(214, 146, 80))
    for (x, y) in [(-70, 50), (-20, 70), (30, 40), (70, 80)]:
        d.rounded_rectangle([cx+x-26, cy+y-22, cx+x+26, cy+y+22], 12, fill=(238, 196, 92))
    for i in range(7):
        x = cx + 60 + (i % 3) * 18; y = cy - 10 + i * 12
        d.line([x, y, x + 34, y + 10], fill=(90, 140, 70), width=10)
    # fork & knife
    d.rounded_rectangle([cx-262, cy-150, cx-246, cy+170], 8, fill=(180, 180, 175))
    for k in range(3):
        d.rectangle([cx-270+k*10, cy-190, cx-266+k*10, cy-140], fill=(180, 180, 175))
    d.rounded_rectangle([cx+246, cy-190, cx+266, cy+170], 10, fill=(180, 180, 175))

def icon_pan(d, cx, cy):
    d.rounded_rectangle([cx-230, cy-130, cx+230, cy+130], 26, fill=(120, 120, 125))
    d.rounded_rectangle([cx-210, cy-110, cx+210, cy+110], 18, fill=(160, 160, 165))
    for (x, y) in [(-130, -50), (-10, -60), (110, -40), (-80, 50), (60, 45)]:
        d.ellipse([cx+x-55, cy+y-35, cx+x+55, cy+y+35], fill=(196, 120, 60))
        d.ellipse([cx+x-38, cy+y-25, cx+x+25, cy+y+5], fill=(220, 150, 82))
    for (x, y) in [(-170, 10), (-20, 10), (150, 40), (0, 80), (-150, 80), (160, -80)]:
        d.rounded_rectangle([cx+x-24, cy+y-20, cx+x+24, cy+y+20], 10, fill=(238, 196, 92))

def icon_pot(d, cx, cy):
    d.ellipse([cx-200, cy-130, cx+200, cy-50], fill=(140, 60, 40))
    d.rounded_rectangle([cx-200, cy-90, cx+200, cy+150], 40, fill=TOMATO)
    d.ellipse([cx-190, cy-120, cx+190, cy-60], fill=(170, 70, 45))
    for (x, y) in [(-90, -95), (20, -100), (110, -88), (-30, -80)]:
        d.ellipse([cx+x-16, cy+y-10, cx+x+16, cy+y+10], fill=(110, 50, 30))
    d.rounded_rectangle([cx-250, cy-60, cx-195, cy-25], 14, fill=(150, 60, 40))
    d.rounded_rectangle([cx+195, cy-60, cx+250, cy-25], 14, fill=(150, 60, 40))
    for i in range(3):  # steam
        x = cx - 80 + i * 80
        d.arc([x-25, cy-230, x+25, cy-170], 90, 270, fill=(200, 195, 185), width=8)
        d.arc([x-25, cy-180, x+25, cy-130], 270, 90, fill=(200, 195, 185), width=8)

def icon_list(d, cx, cy):
    d.rounded_rectangle([cx-170, cy-220, cx+170, cy+220], 20, fill=WHITE, outline=(225, 215, 190), width=5)
    d.rounded_rectangle([cx-60, cy-240, cx+60, cy-200], 12, fill=SAGE)
    f = pop(30, "Medium")
    items = ["Chicken thighs", "Potatoes", "Beans", "Rice", "Eggs", "Cheese"]
    for i, t in enumerate(items):
        y = cy - 160 + i * 62
        d.rounded_rectangle([cx-140, y, cx-108, y+32], 6, outline=DSAGE, width=4)
        if i < 4:
            d.line([cx-136, y+16, cx-126, y+28, cx-104, y-4], fill=TOMATO, width=6)
        d.text((cx-90, y-4), t, font=f, fill=INK)

def icon_clock(d, cx, cy):
    d.ellipse([cx-190, cy-190, cx+190, cy+190], fill=WHITE, outline=INK, width=12)
    for i in range(12):
        a = i * math.pi / 6
        r1, r2 = 150, 172
        d.line([cx+math.cos(a)*r1, cy+math.sin(a)*r1, cx+math.cos(a)*r2, cy+math.sin(a)*r2], fill=INK, width=8)
    d.pieslice([cx-140, cy-140, cx+140, cy+140], -90, 0, fill=(250, 226, 150))
    d.line([cx, cy, cx, cy-120], fill=INK, width=12)
    d.line([cx, cy, cx+95, cy], fill=TOMATO, width=12)
    d.ellipse([cx-16, cy-16, cx+16, cy+16], fill=INK)

def icon_freezer(d, cx, cy):
    for i, col in enumerate([(200, 225, 235), (215, 232, 240), (190, 218, 230)]):
        y = cy - 150 + i * 110
        d.rounded_rectangle([cx-190, y, cx+190, y+95], 16, fill=col, outline=(150, 185, 200), width=4)
        d.rounded_rectangle([cx-170, y+20, cx-20, y+70], 8, fill=WHITE)
        d.text((cx-160, y+24), ["CHILI", "SOUP", "MEATBALLS"][i], font=pop(28), fill=INK)
    # snowflake
    sx, sy = cx + 120, cy - 210
    for k in range(3):
        a = k * math.pi / 3
        d.line([sx-math.cos(a)*50, sy-math.sin(a)*50, sx+math.cos(a)*50, sy+math.sin(a)*50], fill=(120, 170, 200), width=10)

def icon_tacos(d, cx, cy):
    for off in (-120, 120):
        x = cx + off
        d.chord([x-130, cy-120, x+130, cy+140], 180, 360, fill=(240, 200, 110))
        d.ellipse([x-110, cy-60, x-40, cy-10], fill=(196, 120, 60))
        d.ellipse([x-40, cy-80, x+40, cy-20], fill=(90, 150, 70))
        d.ellipse([x+30, cy-60, x+100, cy-10], fill=TOMATO)
        d.chord([x-130, cy-60, x+130, cy+200], 180, 360, fill=(232, 184, 90))
        d.rectangle([x-130, cy+60, x+130, cy+75], fill=CREAM)

def icon_calendar(d, cx, cy):
    d.rounded_rectangle([cx-210, cy-190, cx+210, cy+210], 24, fill=WHITE, outline=(225, 215, 190), width=5)
    d.rounded_rectangle([cx-210, cy-190, cx+210, cy-110], 24, fill=TOMATO)
    d.rectangle([cx-210, cy-140, cx+210, cy-110], fill=TOMATO)
    f = pop(26)
    n = 1
    for r in range(5):
        for c in range(7):
            if n > 30: break
            x = cx - 180 + c * 54; y = cy - 90 + r * 58
            fill = (250, 226, 150) if c == 6 else (245, 240, 228)
            d.rounded_rectangle([x, y, x+46, y+48], 8, fill=fill)
            if n <= 12:
                d.line([x+10, y+26, x+20, y+38, x+38, y+10], fill=DSAGE, width=6)
            n += 1

ICONS = dict(plate=icon_plate, pan=icon_pan, pot=icon_pot, list=icon_list, clock=icon_clock,
             freezer=icon_freezer, tacos=icon_tacos, calendar=icon_calendar)

PH = {'01': '36115189', '02': '36939708', '03': '36959793', '04': '7677891', '05': '15298871', '06': '12788471', '07': '36718510', '08': '5907619', '09': '6414288', '10': '6969718'}
PINS = [
    dict(slug="01-30-dinners-75", kicker="FAMILY OF 4", head=["30 Dinners", "for About", "$75 a Week"],
         sub="One shopping list a week. No 5 p.m. panic.", icon="calendar", top=YELLOW),
    dict(slug="02-sheet-pan-chicken", kicker="ABOUT $9 · SERVES 4", head=["Sheet-Pan", "Chicken &", "Potatoes"],
         sub="10 min prep. One pan. Leftovers for tomorrow.", icon="pan", top=SAGE),
    dict(slug="03-cook-once-eat-twice", kicker="THE BUDGET RULE", head=["Cook Once,", "Eat Twice"],
         sub="Tonight's chicken is tomorrow's tacos.", icon="tacos", top=YELLOW),
    dict(slug="04-grocery-list", kicker="CHEAP GROCERY LIST", head=["7 Dinners,", "One Shopping", "Trip"],
         sub="My weekly list for a family of 4 (about $72).", icon="list", top=SAGE),
    dict(slug="05-15-minute-dinners", kicker="EMERGENCY DINNERS", head=["7 Dinners in", "15 Minutes"],
         sub="For the nights you have nothing left.", icon="clock", top=TOMATO),
    dict(slug="06-no-5pm-panic", kicker="BUSY MOM DINNER PLAN", head=["\"What's for", "Dinner?\"", "Handled."],
         sub="30 easy dinners my kids actually eat.", icon="plate", top=YELLOW),
    dict(slug="07-one-pan-week", kicker="LESS DISHES", head=["One-Pan", "Dinners for", "a Whole Week"],
         sub="One pan or one pot every night.", icon="pan", top=SAGE),
    dict(slug="08-big-pot-chili", kicker="CHEAP DINNER IDEA", head=["Make the", "Chili Big.", "Eat It Twice."],
         sub="A big pot costs almost the same as a small one.", icon="pot", top=TOMATO),
    dict(slug="09-freezer-week", kicker="FREEZER MEALS", head=["Freezer", "Dinners on", "a Budget"],
         sub="Cook on Sunday. Relax on Wednesday.", icon="freezer", top=SAGE),
    dict(slug="10-kids-eat", kicker="PICKY EATERS WELCOME", head=["Cheap Family", "Dinners Kids", "Actually Eat"],
         sub="Simple food. Real prices. No fancy stuff.", icon="plate", top=YELLOW),
]

def make(p):
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    top = p["top"]
    txt = INK if top == YELLOW else WHITE
    # top block
    d.rectangle([0, 0, W, 560], fill=top)
    daisy(d, 905, 85, 70, petal=(255, 255, 255), mid=(245, 193, 46) if top != YELLOW else (230, 150, 30))
    daisy(d, 70, 520, 45, petal=(255, 255, 255), mid=(245, 193, 46) if top != YELLOW else (230, 150, 30))
    kf = pop(36, "Bold")
    center(d, 60, p["kicker"], kf, txt)
    lines = p["head"]
    size = 128 if len(lines) == 2 else 112
    hf = lora(size)
    while max(d.textlength(l, font=hf) for l in lines) > 880:
        size -= 4; hf = lora(size)
    lh = size * 1.12
    y0 = 130 + (400 - lh * len(lines)) / 2
    for i, l in enumerate(lines):
        center(d, y0 + i * lh, l, hf, txt)
    # photo
    ph = Image.open("photos/" + PH[p["slug"][:2]] + ".jpg").convert("RGB")
    bw, bh = W, 1300 - 540
    r = max(bw / ph.width, bh / ph.height)
    ph = ph.resize((int(ph.width * r) + 1, int(ph.height * r) + 1))
    ox = (ph.width - bw) // 2; oy = (ph.height - bh) // 2
    im.paste(ph.crop((ox, oy, ox + bw, oy + bh)), (0, 540))
    d = ImageDraw.Draw(im)
    for x in range(0, W + 60, 60):
        d.ellipse([x - 32, 520, x + 32, 575], fill=top)
    daisy(d, 70, 520, 45, petal=(255, 255, 255), mid=(245, 193, 46) if top != YELLOW else (230, 150, 30))
    # sub
    sf = pop(38, "Medium")
    sub = p["sub"]
    if d.textlength(sub, font=sf) > 900:
        words = sub.split(); mid = len(words) // 2
        parts = [" ".join(words[:mid]), " ".join(words[mid:])]
    else:
        parts = [sub]
    bh2 = 30 + 50 * len(parts)
    yb = 1270 - bh2
    maxw = max(d.textlength(t, font=sf) for t in parts)
    d.rounded_rectangle([(W - maxw) / 2 - 30, yb, (W + maxw) / 2 + 30, yb + bh2], 28, fill=CREAM)
    for i, t in enumerate(parts):
        center(d, yb + 12 + i * 50, t, sf, INK)
    # bottom CTA band
    d.rectangle([0, 1300, W, H], fill=DSAGE)
    cf = pop(48, "Bold"); af = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
    t = "Get the 30-day plan  "; tw = d.textlength(t, font=cf) + d.textlength("→", font=af)
    x = (W - tw) / 2
    d.text((x, 1325), t, font=cf, fill=WHITE); d.text((x + d.textlength(t, font=cf), 1333), "→", font=af, fill=YELLOW)
    center(d, 1400, "Daisy Parker · Dinner's handled.", lora(34, "Italic") if False else pop(30, "Regular"), (230, 236, 222))
    os.makedirs("out_foto", exist_ok=True)
    im.save(f"out_foto/{p['slug']}.png", optimize=True)

for p in PINS:
    make(p)
print("ok")
