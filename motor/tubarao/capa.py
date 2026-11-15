src = open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0]
exec(src)
from PIL import Image
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
im=Image.open('frames/f0200.jpg').convert('RGBA')
strip(im,"PARECE MENTIRA #9",90,'#e0453a',W,70,0)
strip(im,"O QUE É MAIS VELHO:",230,W,K,92,-3); strip(im,"O TUBARÃO",400,'#2f6fb2',W,130,2); strip(im,"OU AS ÁRVORES?",590,Y,K,116,-2)
burst(im,850,1450,165,"VOCÊ\nSABIA?",R,60); tag(im,1700)
im.convert('RGB').save('out/capa.jpg',quality=92)
