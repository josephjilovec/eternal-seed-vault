      *================================================================
      * Purpose: Mainframe Layer - COBOL Deep Storage Ledger
      * Dependencies: IBM Mainframe JCL, VSAM files
      * Module Role: Handles "Deep Storage" ledger on emulated mainframe
      *              tape systems. Readable by computers from 1960s.
      *================================================================
       IDENTIFICATION DIVISION.
       PROGRAM-ID. VAULT-STORAGE.
       AUTHOR. NEXUS-GATES-ENGINEERING.
       DATE-WRITTEN. 2024.
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT VAULT-FILE ASSIGN TO "VAULT.DAT"
           ORGANIZATION IS INDEXED
           ACCESS MODE IS RANDOM
           RECORD KEY IS VAULT-KEY
           FILE STATUS IS FILE-STATUS.
       
       DATA DIVISION.
       FILE SECTION.
       FD  VAULT-FILE
           LABEL RECORDS ARE STANDARD
           RECORD CONTAINS 256 CHARACTERS.
       01  VAULT-RECORD.
           05  VAULT-KEY              PIC X(32).
           05  VAULT-TIMESTAMP        PIC 9(14).
           05  VAULT-DATA             PIC X(200).
           05  VAULT-CHECKSUM         PIC 9(10).
       
       WORKING-STORAGE SECTION.
       01  FILE-STATUS                PIC XX.
       01  WS-RETURN-CODE             PIC 9(4).
       01  WS-MESSAGE                 PIC X(80).
       
       LINKAGE SECTION.
       01  INPUT-KEY                  PIC X(32).
       01  INPUT-DATA                 PIC X(200).
       01  OUTPUT-STATUS              PIC 9(4).
       
       PROCEDURE DIVISION USING INPUT-KEY INPUT-DATA OUTPUT-STATUS.
       
       MAIN-PROCEDURE.
           MOVE ZERO TO OUTPUT-STATUS
           OPEN I-O VAULT-FILE
           
           IF FILE-STATUS NOT = "00"
               MOVE 1 TO OUTPUT-STATUS
               MOVE "FILE OPEN ERROR" TO WS-MESSAGE
               DISPLAY WS-MESSAGE
               GOBACK
           END-IF
           
           MOVE INPUT-KEY TO VAULT-KEY
           READ VAULT-FILE
           
           IF FILE-STATUS = "23"
               *> Record not found, create new
               MOVE FUNCTION CURRENT-DATE TO VAULT-TIMESTAMP
               MOVE INPUT-DATA TO VAULT-DATA
               COMPUTE VAULT-CHECKSUM = 
                   FUNCTION NUMVAL(VAULT-KEY(1:10)) +
                   FUNCTION NUMVAL(VAULT-TIMESTAMP(1:10))
               WRITE VAULT-RECORD
           ELSE
               IF FILE-STATUS = "00"
                   *> Record exists, update
                   MOVE FUNCTION CURRENT-DATE TO VAULT-TIMESTAMP
                   MOVE INPUT-DATA TO VAULT-DATA
                   COMPUTE VAULT-CHECKSUM = 
                       FUNCTION NUMVAL(VAULT-KEY(1:10)) +
                       FUNCTION NUMVAL(VAULT-TIMESTAMP(1:10))
                   REWRITE VAULT-RECORD
               ELSE
                   MOVE 2 TO OUTPUT-STATUS
                   MOVE "FILE READ ERROR" TO WS-MESSAGE
                   DISPLAY WS-MESSAGE
               END-IF
           END-IF
           
           CLOSE VAULT-FILE
           GOBACK.
       
       END PROGRAM VAULT-STORAGE.

