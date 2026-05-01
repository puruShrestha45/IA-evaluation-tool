import json
import pytest
import api.main as main_module
from api.main import load_all, resolve_pdf, resolve_jd_pdf

SAMPLE = [
    {"interview_detail_id": 477, "interviewee_name": "Alice", "job_name": "Engineer",
     "resume_local_path": "", "resume_file_path": ""},
    {"interview_detail_id": 476, "interviewee_name": "Bob", "job_name": "Analyst",
     "resume_local_path": "", "resume_file_path": ""},
    {"interview_detail_id": 999, "interviewee_name": "Charlie", "job_name": "Designer",
     "resume_local_path": "", "resume_file_path": ""},
]


@pytest.fixture
def mock_data(tmp_path, monkeypatch):
    f = tmp_path / "data.json"
    f.write_text(json.dumps(SAMPLE))
    monkeypatch.setattr(main_module, "DATA_FILE", f)


class DescribeLoadAll:
    def it_should_exclude_records_not_in_allowed_ids(self, mock_data):
        result = load_all()
        ids = [r["interview_detail_id"] for r in result]
        assert 999 not in ids

    def it_should_include_records_with_allowed_ids(self, mock_data):
        result = load_all()
        ids = [r["interview_detail_id"] for r in result]
        assert 477 in ids
        assert 476 in ids

    def it_should_preserve_original_record_fields(self, mock_data):
        result = load_all()
        record = next(r for r in result if r["interview_detail_id"] == 477)
        assert record["interviewee_name"] == "Alice"

    def it_should_return_empty_list_when_no_records_match_allowed_ids(
        self, tmp_path, monkeypatch
    ):
        f = tmp_path / "no_match.json"
        f.write_text(json.dumps([{"interview_detail_id": 999}]))
        monkeypatch.setattr(main_module, "DATA_FILE", f)
        assert load_all() == []


class DescribeResolvePdf:
    def it_should_return_none_when_both_paths_are_empty(self):
        assert resolve_pdf({"resume_local_path": "", "resume_file_path": ""}) is None

    def it_should_return_none_when_local_path_does_not_exist_on_disk(self):
        result = resolve_pdf(
            {"resume_local_path": "/nonexistent/resume.pdf", "resume_file_path": ""}
        )
        assert result is None

    def it_should_return_none_when_relative_file_path_does_not_exist(self):
        result = resolve_pdf(
            {"resume_local_path": "", "resume_file_path": "missing/resume.pdf"}
        )
        assert result is None


class DescribeResolveJdPdf:
    def it_should_return_none_when_job_id_is_absent(self):
        assert resolve_jd_pdf({}) is None

    def it_should_return_none_when_pdf_file_does_not_exist_for_job_id(self):
        assert resolve_jd_pdf({"job_id": "nonexistent_job_xyz"}) is None
