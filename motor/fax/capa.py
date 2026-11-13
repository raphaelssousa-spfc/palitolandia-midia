src = open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0]
exec(src)
from PIL import Image
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
im=Image.open('frames/f0300.jpg').convert('RGBA')
strip(im,"PARECE MENTIRA #8",90,'#e0453a',W,70,0)
strip(im,"O QUE VEIO PRIMEIRO:",230,W,K,96,-3); strip(im,"O FAX",400,'#2f6fb2',W,130,2); strip(im,"OU O TELEFONE?",590,Y,K,120,-2)
burst(im,850,1450,165,"VOCÊ\nSABIA?",R,60); tag(im,1700)
im.convert('RGB').save('out/capa.jpg',quality=92)
