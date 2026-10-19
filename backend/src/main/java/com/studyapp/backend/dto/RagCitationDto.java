package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagCitationDto {
    private int citationIndex;
    private Long documentId;
    private String documentTitle;
    private String fileName;
    private Integer pageNumber;
    private String sectionHeading;
    private String snippet;
    private double relevanceScore; // 0.0 - 1.0
}
