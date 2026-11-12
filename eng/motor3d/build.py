"""Monta web/main.js de um episódio: base.js + episodios/<id>/scene.js + episodios/<id>/story.js
uso: python3 build.py <id>"""
import sys, os, shutil
ep = os.path.join('episodios', sys.argv[1])
src = open('base.js').read() + open(os.path.join(ep, 'scene.js')).read() + open(os.path.join(ep, 'story.js')).read()
open('web/main.js', 'w').write(src)
shutil.copy(os.path.join(ep, 'script.json'), 'script.json')
print('web/main.js montado para', sys.argv[1])
