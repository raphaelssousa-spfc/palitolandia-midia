import sys; sys.path.insert(0, '/home/claude/palitolandia-midia/motor')
src = open('/home/claude/palitolandia-midia/motor/capas.py').read().split("W,K,Y,R=")[0]
exec(src)
from PIL import Image
W,K,Y,R='#ffffff','#1a1030','#ffd23f','#ff2d2d'
im=Image.open('frames/f0400.jpg').convert('RGBA')
strip(im,"O QUE VEIO PRIMEIRO:",230,W,K,96,-3); strip(im,"A LATA",400,Y,K,140,2); strip(im,"OU O ABRIDOR?",590,R,W,120,-2)
burst(im,860,1200,165,"FAÇA\nA CONTA",'#2f6fb2',56); tag(im,1700)
im.convert('RGB').save('out/capa.jpg',quality=92)
