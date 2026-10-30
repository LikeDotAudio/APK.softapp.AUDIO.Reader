# Delivery — AUDIO.reader (Read.Like.audio)

## Build and test
No build step and no package dependency: `src/` is served as is. No automated tests; the check is opening `src/index.html`. `.apk.scripts/smoke.py` (root) checks HEAD is on origin and the live pages answer — see [SMOKE.md](../%F0%9F%A7%A9Manual%20and%20Artifacts/SMOKE.md).

## Where it lands
- **https://read.like.audio/** — `.github/workflows/ftp-deploy.yml` uploads `src/` over FTPS (`SamKirkland/FTP-Deploy-Action@v4.3.5`, secrets `FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD`) on every push to this repo's `master` branch.
- **apk.audio** — `https://apk.audio/APK:Softapps/AUDIO/AUDIO.reader/src/index.html`. The APK.audio root's `.github/workflows/ci.yml` uploads the Softapps tree with `PODS/POD.THIN/WEB.Frontend-Assets/.apk.scripts/deploy.py` on a push to the root's `main`; this repo reaches it through a submodule bump (`.apk.scripts/deploy_all.py`).
- **A node** — copied with the Softapps tree into WEB.Frontend-Assets (`/srv/www/Softapps`) and Storage-Portal (`DATABASE.server.SQL`, `:8080`). After an edit: `up-stack.sh WEB.Frontend-Assets` and `up-stack.sh DATABASE.server.SQL`.

## Not automated
Any test of the formatter or chunker; the root submodule bump; node image rebuilds. The branch is `master`, not `main` — a push to `main` deploys nothing.

Repository: `https://github.com/LikeDotAudio/APK.softapp.AUDIO.Reader.git` (the page's header links the older `LikeDotAudio/Read.Like.audio`).
