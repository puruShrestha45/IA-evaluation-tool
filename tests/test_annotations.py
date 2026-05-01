import pytest
from api.main import flatten_annotations, reconstruct_annotations

EMAIL = "reviewer@fusemachines.com"
ANN_DATA = {
    "jd_parsing": {"must_haves": 4, "completeness": 3},
    "answer_eval": {"e0": {"score_accuracy": 2, "gap_strength": 5}},
    "question_plan": {"questions": {"0": {"relevance": 4, "tailoring_dims": ["Too generic"]}}},
    "feedback": {"jd": "Looks good overall"},
}


# ── Unit: flatten_annotations ──────────────────────────────────────────────────

class DescribeFlattenAnnotations:
    def it_should_produce_a_score_row_for_each_numeric_value(self):
        scores, _ = flatten_annotations({"jd_parsing": {"must_haves": 3}})
        assert len(scores) == 1
        assert scores[0] == {"tab": "jd_parsing", "metric_key": "must_haves",
                              "question_index": None, "score": 3, "dims": []}

    def it_should_attach_dims_to_the_matching_score_row(self):
        scores, _ = flatten_annotations({
            "jd_parsing": {"must_haves": 4, "must_haves_dims": ["Wrong domain"]}
        })
        row = next(s for s in scores if s["metric_key"] == "must_haves")
        assert row["dims"] == ["Wrong domain"]

    def it_should_set_question_index_for_per_question_scores(self):
        scores, _ = flatten_annotations({
            "question_plan": {"questions": {"2": {"relevance": 5}}}
        })
        assert scores[0]["question_index"] == 2

    def it_should_parse_answer_eval_index_from_e_prefix(self):
        scores, _ = flatten_annotations({
            "answer_eval": {"e1": {"score_accuracy": 3}}
        })
        assert scores[0]["question_index"] == 1

    def it_should_extract_feedback_into_separate_list(self):
        _, feedbacks = flatten_annotations({"feedback": {"jd": "Some note"}})
        assert feedbacks == [{"tab": "jd", "text": "Some note"}]

    def it_should_ignore_empty_feedback_strings(self):
        _, feedbacks = flatten_annotations({"feedback": {"jd": ""}})
        assert feedbacks == []

    def it_should_ignore_non_numeric_non_dims_values(self):
        scores, _ = flatten_annotations({"jd_parsing": {"must_haves": "CORRECT"}})
        assert scores == []


# ── Unit: reconstruct_annotations ─────────────────────────────────────────────

class DescribeReconstructAnnotations:
    def it_should_rebuild_tab_level_scores(self):
        rows = [{"tab": "jd_parsing", "metric_key": "must_haves",
                 "question_index": None, "score": 4, "dims": []}]
        ann = reconstruct_annotations(rows, [])
        assert ann["jd_parsing"]["must_haves"] == 4

    def it_should_rebuild_dims_alongside_their_score(self):
        rows = [{"tab": "jd_parsing", "metric_key": "must_haves",
                 "question_index": None, "score": 3, "dims": ["Wrong domain"]}]
        ann = reconstruct_annotations(rows, [])
        assert ann["jd_parsing"]["must_haves_dims"] == ["Wrong domain"]

    def it_should_rebuild_per_question_scores_under_question_plan(self):
        rows = [{"tab": "question_plan", "metric_key": "relevance",
                 "question_index": 0, "score": 5, "dims": []}]
        ann = reconstruct_annotations(rows, [])
        assert ann["question_plan"]["questions"]["0"]["relevance"] == 5

    def it_should_rebuild_answer_eval_under_e_key(self):
        rows = [{"tab": "answer_eval", "metric_key": "score_accuracy",
                 "question_index": 1, "score": 2, "dims": []}]
        ann = reconstruct_annotations(rows, [])
        assert ann["answer_eval"]["e1"]["score_accuracy"] == 2

    def it_should_rebuild_feedback_entries(self):
        ann = reconstruct_annotations([], [{"tab": "resume", "text": "Nice"}])
        assert ann["feedback"]["resume"] == "Nice"

    def it_should_be_inverse_of_flatten_for_a_full_annotation(self):
        scores, feedbacks = flatten_annotations(ANN_DATA)
        rebuilt = reconstruct_annotations(scores, feedbacks)
        assert rebuilt["jd_parsing"]["must_haves"] == 4
        assert rebuilt["answer_eval"]["e0"]["score_accuracy"] == 2
        assert rebuilt["question_plan"]["questions"]["0"]["relevance"] == 4
        assert rebuilt["feedback"]["jd"] == "Looks good overall"


# ── Integration: annotation API ───────────────────────────────────────────────

class DescribeGetAnnotations:
    def it_should_return_empty_dict_when_no_annotation_exists(self, client):
        response = client.get("/api/annotations/0", params={"email": EMAIL})
        assert response.status_code == 200
        assert response.json() == {}

    def it_should_return_empty_dict_for_a_different_email_than_saved(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        response = client.get("/api/annotations/0", params={"email": "other@fusemachines.com"})
        assert response.json() == {}


class DescribePostAnnotations:
    def it_should_save_annotation_and_return_ok(self, client):
        response = client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def it_should_return_saved_scores_on_subsequent_get(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        result = client.get("/api/annotations/0", params={"email": EMAIL}).json()
        assert result["jd_parsing"]["must_haves"] == 4
        assert result["answer_eval"]["e0"]["score_accuracy"] == 2

    def it_should_upsert_when_annotation_already_exists(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": {"jd_parsing": {"must_haves": 1}}})
        client.post("/api/annotations/0", json={"email": EMAIL, "data": {"jd_parsing": {"must_haves": 5}}})
        result = client.get("/api/annotations/0", params={"email": EMAIL}).json()
        assert result["jd_parsing"]["must_haves"] == 5

    def it_should_keep_annotations_isolated_per_dataset_index(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": {"jd_parsing": {"must_haves": 1}}})
        client.post("/api/annotations/1", json={"email": EMAIL, "data": {"jd_parsing": {"must_haves": 4}}})
        assert client.get("/api/annotations/0", params={"email": EMAIL}).json()["jd_parsing"]["must_haves"] == 1
        assert client.get("/api/annotations/1", params={"email": EMAIL}).json()["jd_parsing"]["must_haves"] == 4

    def it_should_return_400_when_email_is_missing_from_body(self, client):
        assert client.post("/api/annotations/0", json={"data": ANN_DATA}).status_code == 400


class DescribeDeleteAnnotations:
    def it_should_delete_an_existing_annotation(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        client.delete("/api/annotations/0", params={"email": EMAIL})
        assert client.get("/api/annotations/0", params={"email": EMAIL}).json() == {}

    def it_should_return_ok_even_when_annotation_does_not_exist(self, client):
        response = client.delete("/api/annotations/0", params={"email": EMAIL})
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def it_should_not_delete_annotation_belonging_to_a_different_email(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        client.delete("/api/annotations/0", params={"email": "other@fusemachines.com"})
        assert client.get("/api/annotations/0", params={"email": EMAIL}).json() != {}
