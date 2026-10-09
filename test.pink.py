import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.pop("ANTHROPIC_API_KEY", None)

from pink import skills  # noqa: E402
from pink.brain import Brain  # noqa: E402


class TestSkills(unittest.TestCase):
    def test_hora(self):
        self.assertIn("Agora são", skills.get_time())

    def test_info_sistema(self):
        info = skills.system_info()
        for chave in ("cpu", "ram", "disco", "bateria"):
            self.assertIn(chave, info)

    def test_app_invalido(self):
        self.assertIn("não parece válido", skills.open_app("calc & del *"))


class TestBrainLocal(unittest.TestCase):
    def setUp(self):
        self.brain = Brain()

    def test_sem_chave_fica_offline(self):
        self.assertFalse(self.brain.conectada)

    def test_hora(self):
        self.assertIn("Agora são", self.brain.responder("Pink, que horas são?")["text"])

    def test_vazio(self):
        self.assertIn("Não ouvi", self.brain.responder("   ")["text"])


if __name__ == "__main__":
    unittest.main()
