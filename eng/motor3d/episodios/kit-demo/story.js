// ================= KIT-DEMO: câmera passa pelas estações =================
window.renderFrame = f => { const K = ST[Math.min(f, ST.length - 1)]; cam.position.copy(K[0]); cam.fov = K[2]; cam.lookAt(K[1]); cam.updateProjectionMatrix();
  sun.position.set(K[1].x + 5, 11, 7.5); sun.target.position.copy(K[1]); R.render(scene, cam); ov.innerHTML = `<div class="big" style="top:120px;font-size:80px">KIT ${f}</div>`; };
window.renderFrame(0); window.ready = true;
} catch (e) { console.log('ERR ' + e.stack); window.err = String(e); }
