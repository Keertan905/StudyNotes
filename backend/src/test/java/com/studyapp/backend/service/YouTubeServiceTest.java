package com.studyapp.backend.service;

import com.studyapp.backend.dto.YouTubeDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class YouTubeServiceTest {

    @InjectMocks
    private YouTubeService youTubeService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(youTubeService, "defaultMaxResults", 20);
        ReflectionTestUtils.setField(youTubeService, "timeoutSeconds", 15);
    }

    @Test
    void isConfigured_whenKeyIsMissingOrPlaceholder_returnsFalse() {
        ReflectionTestUtils.setField(youTubeService, "apiKey", "");
        assertFalse(youTubeService.isConfigured());

        ReflectionTestUtils.setField(youTubeService, "apiKey", "your-youtube-api-key-here");
        assertFalse(youTubeService.isConfigured());

        ReflectionTestUtils.setField(youTubeService, "apiKey", "${YOUTUBE_API_KEY:}");
        assertFalse(youTubeService.isConfigured());
    }

    @Test
    void isConfigured_whenKeyIsValid_returnsTrue() {
        ReflectionTestUtils.setField(youTubeService, "apiKey", "AIzaSyD_TEST_SAMPLE_KEY");
        assertTrue(youTubeService.isConfigured());
    }

    @Test
    void searchVideos_whenNotConfigured_returnsCleanNoticeResponse() {
        ReflectionTestUtils.setField(youTubeService, "apiKey", "");

        YouTubeDto.SearchRequest request = YouTubeDto.SearchRequest.builder()
                .query("Binary Search")
                .build();

        YouTubeDto.SearchResponse response = youTubeService.searchVideos(request);
        assertNotNull(response);
        assertFalse(response.isApiKeyConfigured());
        assertTrue(response.getVideos().isEmpty());
        assertNotNull(response.getErrorMessage());
        assertTrue(response.getErrorMessage().contains("YouTube Data API v3 key is not configured"));
    }
}
