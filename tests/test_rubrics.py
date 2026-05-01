class DescribeGetRubrics:
    def it_should_return_200(self, client):
        assert client.get("/api/rubrics").status_code == 200

    def it_should_contain_question_identification_key(self, client):
        assert "6.2" in client.get("/api/rubrics").json()

    def it_should_contain_oop_detection_key(self, client):
        assert "6.3" in client.get("/api/rubrics").json()

    def it_should_contain_transcript_split_key(self, client):
        assert "6.4" in client.get("/api/rubrics").json()

    def it_should_include_title_and_content_for_each_rubric(self, client):
        rubrics = client.get("/api/rubrics").json()
        for key in ("6.2", "6.3", "6.4"):
            assert "title" in rubrics[key]
            assert "content" in rubrics[key]
