package cit.edu.din.queuexpress.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String path,
        List<String> details) {
}
