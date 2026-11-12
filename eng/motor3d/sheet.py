import sys,glob
from PIL import Image
fs=sorted(glob.glob(sys.argv[1]+'/*.jpg'));W=270;H=480;cols=5;rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(W*cols,H*rows))
for i,f in enumerate(fs): S.paste(Image.open(f).resize((W,H)),((i%cols)*W,(i//cols)*H))
S.save(sys.argv[2],quality=88)
