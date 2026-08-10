package com.employeesystem.emsbackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a delete is blocked because other records still reference
 * the thing being deleted (an employee who manages people, has leave
 * history, or has a linked login account). Distinct from
 * DuplicateResourceException — that one is about create-time conflicts,
 * this one is about delete-time conflicts, and conflating them was
 * producing a misleading error message before this existed.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ResourceInUseException extends RuntimeException {
    public ResourceInUseException(String message) {
        super(message);
    }
}
