import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.pop("ANTHROPIC_API_KEY", None)
os.environ["PINK_NO_BROWSER"] = "1"

from pink import skills  # noqa: E402
from pink.brain import Brain  # noqa: E402
import app as pink_app  # noqa: E402


class TestSkills(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.tasks_path = Path(self.tmpdir.name) / "tasks.json"
        self.prev_tasks_env = os.environ.get("PINK_TASKS_FILE")
        os.environ["PINK_TASKS_FILE"] = str(self.tasks_path)

    def tearDown(self):
        if self.prev_tasks_env is None:
            os.environ.pop("PINK_TASKS_FILE", None)
        else:
            os.environ["PINK_TASKS_FILE"] = self.prev_tasks_env
        self.tmpdir.cleanup()

    def test_hora(self):
        self.assertIn("Agora são", skills.get_time())

    def test_info_sistema(self):
        info = skills.system_info()
        for chave in ("cpu", "ram", "disco", "bateria"):
            self.assertIn(chave, info)

    def test_app_invalido(self):
        self.assertIn("não parece válido", skills.open_app("calc & del *"))

    def test_calculadora_segura(self):
        self.assertEqual("O resultado é 30.", skills.calculate("15% de 200"))
        self.assertEqual("O resultado é 110.", skills.calculate("25 * 4 + 10"))
        self.assertEqual("O resultado é 12.", skills.calculate("raiz quadrada de 144"))
        self.assertIn("zero", skills.calculate("10 / 0"))
        self.assertIn("Não consegui", skills.calculate("__import__('os').system('ls')"))

    def test_tarefas_crud(self):
        self.assertIn("vazia", skills.list_tasks())
        msg, acao = skills.add_task("Revisar biologia")
        self.assertIn("Revisar biologia", msg)
        self.assertEqual(acao["type"], "tasks_updated")
        self.assertIn("Revisar biologia", skills.list_tasks())

        msg_done, _ = skills.complete_task("1")
        self.assertIn("concluída", msg_done)
        msg_clear, _ = skills.clear_tasks(only_done=True)
        self.assertIn("Limpei 1", msg_clear)

    def test_timer(self):
        msg, acao = skills.start_timer(25, "Pomodoro")
        self.assertIn("25 minutos", msg)
        self.assertEqual(acao["type"], "timer_start")
        self.assertEqual(acao["seconds"], 1500)
        msg_inval, acao_inval = skills.start_timer(999)
        self.assertIn("4 horas", msg_inval)
        self.assertEqual(acao_inval, {})

    def test_clima_com_mock(self):
        fake_geo = {"results": [{"latitude": -25.4, "longitude": -49.2, "name": "Curitiba", "admin1": "Paraná"}]}
        fake_clima = {
            "current": {"temperature_2m": 22, "apparent_temperature": 21, "relative_humidity_2m": 60, "weather_code": 1},
            "daily": {"temperature_2m_max": [25], "temperature_2m_min": [14], "precipitation_probability_max": [10]},
        }
        with mock.patch("pink.skills._fetch_json", side_effect=[fake_geo, fake_clima]):
            texto, acao = skills.get_weather("Curitiba")
        self.assertIn("Curitiba", texto)
        self.assertIn("22 graus", texto)
        self.assertIsNone(acao)

    def test_entretenimento(self):
        self.assertTrue(skills.tell_joke())
        self.assertTrue(skills.tell_curiosity())
        self.assertTrue(skills.motivate())
        self.assertIn("moeda", skills.flip_coin())
        self.assertIn("dado", skills.roll_dice(6))


class TestBrainLocal(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.prev_tasks_env = os.environ.get("PINK_TASKS_FILE")
        os.environ["PINK_TASKS_FILE"] = str(Path(self.tmpdir.name) / "tasks.json")
        self.brain = Brain()

    def tearDown(self):
        if self.prev_tasks_env is None:
            os.environ.pop("PINK_TASKS_FILE", None)
        else:
            os.environ["PINK_TASKS_FILE"] = self.prev_tasks_env
        self.tmpdir.cleanup()

    def test_sem_chave_fica_offline(self):
        self.assertFalse(self.brain.conectada)

    def test_hora(self):
        self.assertIn("Agora são", self.brain.responder("Pink, que horas são?")["text"])

    def test_hora_nome_custom(self):
        r = self.brain.responder("Aurora, que horas são?", config={"assistantName": "Aurora"})
        self.assertIn("Agora são", r["text"])

    def test_vazio(self):
        self.assertIn("Não ouvi", self.brain.responder("   ")["text"])

    def test_saudacao_e_identidade(self):
        r = self.brain.responder("Oi", config={"assistantName": "Aurora", "userName": "Manu", "personality": "jarvis"})
        self.assertIn("Aurora", r["text"])
        self.assertIn("Manu", r["text"])
        r_ajuda = self.brain.responder("Oi, o que você sabe fazer?")
        self.assertIn("previsão do tempo", r_ajuda["text"])
        r_tudo = self.brain.responder("Oi, tudo bem?")
        self.assertIn("ótima", r_tudo["text"])

    def test_personalizacao_por_voz(self):
        r1 = self.brain.responder("Muda seu nome para Luna")
        self.assertEqual(r1["client_actions"][0], {"type": "set_pref", "key": "assistantName", "value": "Luna"})
        r2 = self.brain.responder("Ativa o tema rose gold")
        self.assertEqual(r2["client_actions"][0], {"type": "set_pref", "key": "theme", "value": "rose-gold"})
        r3 = self.brain.responder("Ativa o holograma cristal")
        self.assertEqual(r3["client_actions"][0], {"type": "set_pref", "key": "orbStyle", "value": "cristal"})

    def test_timer_e_tarefas_e_calculo(self):
        rt = self.brain.responder("Inicia um pomodoro")
        self.assertEqual(rt["client_actions"][0]["type"], "timer_start")
        self.assertEqual(rt["client_actions"][0]["seconds"], 1500)

        rl = self.brain.responder("Anota comprar canetas rosa")
        self.assertIn("comprar canetas rosa", rl["text"])
        self.assertIn("comprar canetas rosa", self.brain.responder("Quais são meus lembretes?")["text"])

        rc = self.brain.responder("Quanto é 15% de 200?")
        self.assertIn("30", rc["text"])

    def test_abrir_site_gera_link(self):
        r = self.brain.responder("Abrir YouTube")
        self.assertIn("youtube.com", r["text"])
        self.assertEqual(r["client_actions"][0]["type"], "open_url")
        self.assertIn("youtube.com", r["client_actions"][0]["url"])


class TestFlaskApp(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.prev_tasks_env = os.environ.get("PINK_TASKS_FILE")
        os.environ["PINK_TASKS_FILE"] = str(Path(self.tmpdir.name) / "tasks.json")
        self.client = pink_app.app.test_client()

    def tearDown(self):
        if self.prev_tasks_env is None:
            os.environ.pop("PINK_TASKS_FILE", None)
        else:
            os.environ["PINK_TASKS_FILE"] = self.prev_tasks_env
        self.tmpdir.cleanup()

    def test_rotas_principais(self):
        with self.client.get("/") as resp:
            self.assertEqual(resp.status_code, 200)
        cfg = self.client.get("/api/config").get_json()
        self.assertIn("assistente", cfg)
        st = self.client.get("/api/status").get_json()
        self.assertIn("cpu", st)

        chat = self.client.post("/api/chat", json={"message": "Que horas são?"}).get_json()
        self.assertIn("Agora são", chat["text"])

        t1 = self.client.post("/api/tasks", json={"text": "Estudar física"}).get_json()
        self.assertEqual(len(t1["tasks"]), 1)
        tid = t1["tasks"][0]["id"]
        t2 = self.client.patch(f"/api/tasks/{tid}").get_json()
        self.assertTrue(t2["tasks"][0]["done"])
        t3 = self.client.delete(f"/api/tasks/{tid}").get_json()
        self.assertEqual(len(t3["tasks"]), 0)


if __name__ == "__main__":
    unittest.main()
