"""Run without Docker/SSH: python3 -m unittest discover -s deploy/tests."""
import fcntl
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

DEPLOY = Path(__file__).resolve().parents[1]


class SharedNginxTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.live = self.root / 'nginx.conf'
        self.original = '''events {}\nhttp {\n  server {\n    listen 443 ssl;\n    http2 on;\n    server_name batuara.org.br;\n    location / { return 200; }\n  }\n  server {\n    location /driverhub/ { return 200; }\n  }\n  server { server_name petz360.com.br bela360.com.br barbear.me vivercomsaude.com.br; }\n}\n'''
        self.live.write_text(self.original)
        self.lock = self.root / 'lock'
        for file in DEPLOY.glob('nginx-allugme.*.conf'):
            shutil.copy(file, self.root)
        shutil.copy(DEPLOY / 'apply-nginx-allugme.py', self.root)
        script = (DEPLOY / 'apply-shared-nginx-oci.sh').read_text()
        script = script.replace('/var/www/nginx/nginx.conf', str(self.live)).replace('/tmp/nginx-domains-deploy.lock', str(self.lock))
        self.script = self.root / 'apply.sh'
        self.script.write_text(script)
        mock = self.root / 'sudo'
        mock.write_text('''#!/usr/bin/env python3
import os,sys,subprocess
from pathlib import Path
a=sys.argv[1:]
if a[0]=='-n':a=a[1:]
if a[0]!='docker':sys.exit(subprocess.run(a).returncode)
if a[1]=='cp':sys.exit(0)
log=Path(os.environ['MOCK_LOG'])
with log.open('a') as f:f.write(' '.join(a)+'\\n')
mode=os.environ.get('MOCK_MODE','')
if '-c' in a:
 if mode=='invalid':sys.exit(1)
 if mode=='stale':Path(os.environ['MOCK_LIVE']).write_text('external change\\n')
if mode=='reload-fails' and 'reload' in a:
 marker=Path(str(log)+'.failed')
 if not marker.exists():marker.touch();sys.exit(1)
''')
        mock.chmod(0o755)
        self.env = dict(os.environ, PATH=str(self.root)+':'+os.environ['PATH'], MOCK_LOG=str(self.root/'calls'), MOCK_LIVE=str(self.live))

    def run_helper(self, mode=''):
        return subprocess.run(['bash', str(self.script)], env=dict(self.env, MOCK_MODE=mode), capture_output=True, text=True)

    def test_success_preserves_other_domains_and_inode(self):
        inode = self.live.stat().st_ino
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(inode, self.live.stat().st_ino)
        spec = importlib.util.spec_from_file_location('renderer', DEPLOY/'apply-nginx-allugme.py')
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        normalize = lambda s: [line for line in module.strip_allugme_blocks(s).splitlines() if line.strip()]
        self.assertEqual(normalize(self.original), normalize(self.live.read_text()))
        self.assertEqual(next(self.root.glob('nginx.conf.before-allugme-*')).read_text(), self.original)

    def test_invalid_candidate_never_writes_live(self):
        self.assertNotEqual(self.run_helper('invalid').returncode, 0)
        self.assertEqual(self.live.read_text(), self.original)
        self.assertFalse(list(self.root.glob('nginx.conf.before-allugme-*')))

    def test_stale_candidate_preserves_external_change(self):
        self.assertNotEqual(self.run_helper('stale').returncode, 0)
        self.assertEqual(self.live.read_text(), 'external change\n')

    def test_reload_failure_rolls_back_in_place(self):
        inode = self.live.stat().st_ino
        self.assertNotEqual(self.run_helper('reload-fails').returncode, 0)
        self.assertEqual(self.live.read_text(), self.original)
        self.assertEqual(self.live.stat().st_ino, inode)

    def test_busy_lock_refuses_update(self):
        with self.lock.open('w') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.assertNotEqual(self.run_helper().returncode, 0)
        self.assertEqual(self.live.read_text(), self.original)


if __name__ == '__main__':
    unittest.main()
