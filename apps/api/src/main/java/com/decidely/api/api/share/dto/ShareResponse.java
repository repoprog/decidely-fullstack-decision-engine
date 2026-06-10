package com.decidely.api.api.share.dto;

public record ShareResponse(
        String shareUrl,
        String token
) {
}