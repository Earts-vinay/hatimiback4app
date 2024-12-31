<?php

require __DIR__.'/vendor/autoload.php';

use HubSpot\Factory;
use HubSpot\Client\Crm\Contacts\ApiException;
use HubSpot\Client\Crm\Contacts\Model\BatchInputSimplePublicObjectBatchInput;
use HubSpot\Client\Crm\Contacts\Model\SimplePublicObjectBatchInput;

use HubSpot\Client\Crm\Contacts\Model\AssociationSpec;
use HubSpot\Client\Crm\Contacts\Model\BatchInputSimplePublicObjectInputForCreate;
use HubSpot\Client\Crm\Contacts\Model\PublicAssociationsForObject;
use HubSpot\Client\Crm\Contacts\Model\PublicObjectId;
use HubSpot\Client\Crm\Contacts\Model\SimplePublicObjectInputForCreate;


use HubSpot\Client\Crm\Contacts\Model\SimplePublicObjectId;
use HubSpot\Client\Crm\Contacts\Model\BatchReadInputSimplePublicObjectId;



$client = HubSpot\Factory::createWithAccessToken('pat-na1-95236b38-18e1-4907-84d3-1ab069a831a3');

$myConnection = mysqli_connect("localhost","root","Hobnob@123","calendly") or die ("could not connect to mysql");

$call_deal = false;



// $contactEmail = $email;
// $full_name = $name;
// $consultation_office_location = $location;
// $phone_number = $phone_no;
// $how_did_you_hear_about_us = $hear;
// $body_area_most_interested = $interested;
// $birth_date = $date_of_birth;

$contactEmail = 'tejas-test-record-in2@gmail.com';
$full_name = 'tejaswita Shrivastava';
$consultation_office_location = '57 Danbury Road Executive House Wilton CT 06897';
$phone_number = "9865320236";
$how_did_you_hear_about_us = 'Google Search';
$body_area_most_interested = 'Stomach/Belly;Arms;Face/Neck/Chin;Calves/Lower legs;Other';
$scheduled_event_name = "Laser Body Renewal Consultation in Wilton CT Office";
$consultation_office_location == '57 Danbury Road Executive House Wilton CT 06897';

// $contactEmail = 'tejaswita-new@esenseit.in';
// $full_name = 'tejaswita New';
// $consultation_office_location = '57 Danbury Road Executive House Wilton CT 06897';
// $phone_number = "+91 9325233088";
// $how_did_you_hear_about_us = 'Facebook';
// $body_area_most_interested = 'Stomach/Core/Belly';

// $sql15 =sprintf("INSERT INTO new_contact SET  id='200',payload='%s'",$contactEmail);
// $sql15 =sprintf("INSERT INTO new_contact SET  id='200',payload='contact file'");
// if(!($res25 = mysqli_query($myConnection,$sql15))){echo "ERROR : -".$sql15." : - ".mysqli_error($myConnection); exit;}


  $consultation_status = "Consultation Scheduled";
  $deal_name = $full_name;
  $lifecyclestage = 'opportunity';

  if($full_name !== ""){
    $words = explode(" ", $full_name);
    $first_name = $words[0];
    $last_name = $words[1];
  }else{
    $first_name = "";
    $last_name = "";
  }

  if($consultation_office_location == '57 Danbury Road Executive House Wilton CT 06897'){
    $consultation_loc = 'WIlton CT';
    $consultation_type = 'In Person';
    $hubspot_owner_id = '434535262'; // Jason Lord
  }else{
    $consultation_type = 'Virtual/Remote to Office';
    if($consultation_office_location == '703 Hebron Avenue Suite 2E Glastonbury CT 06833' || $consultation_office_location == '703 Hebron Avenue, Suite 2E Glastonbury CT 06833'){
    // if($consultation_office_location == 'Glastonbury CT'){
      $consultation_loc = 'Glastonbury CT';
      $hubspot_owner_id = '446331548'; // Bozena Wikira
    }else{
      $consultation_loc = 'Branford CT';
      $hubspot_owner_id = '710199351'; // Brandford office
    }
  }

  // if($how_did_you_hear_about_us == 'Radio 98Q' || $how_did_you_hear_about_us == 'Radio 99.1'){
  //   $how_did_you_hear_about_us = 'Radio commercial';
  // }

  try {
    // update contact details
    // $sql15 =sprintf("INSERT INTO new_contact SET  id='200',payload='contact fetched'");
    // if(!($res25 = mysqli_query($myConnection,$sql15))){echo "ERROR : -".$sql15." : - ".mysqli_error($myConnection); exit;}


    $apiResponse = $client->crm()->contacts()->basicApi()->getById($contactEmail, null, null, null, false, 'email');
    $list_details = json_decode($apiResponse, true);
    // print_r($list_details);
    // var_dump($apiResponse);
    $contact_id = $list_details['id'];

    $properties1_lifecycle = [
      'lifecyclestage' => '',
    ];

    $simplePublicObjectBatchInput1_lifecycle = new SimplePublicObjectBatchInput([
      'id' => $contact_id,
      'properties' => $properties1_lifecycle
    ]);
    $batchInputSimplePublicObjectBatchInput_lifecycle = new BatchInputSimplePublicObjectBatchInput([
      'inputs' => [$simplePublicObjectBatchInput1_lifecycle],
    ]);

    if($scheduled_event_name == "Laser Body Renewal Consultation in Wilton CT Office"){
      $properties1 = [
        'firstname' => $first_name,
        'lastname' => $last_name,
        'lifecyclestage' => $lifecyclestage,
        'phone' => $phone_number,
        'how_did_you_hear_about_us_' => $how_did_you_hear_about_us,
        'consultation_office_location' => $consultation_loc,
        'consultation_type' => $consultation_type,
        'consultation_status' => $consultation_status,
        'hubspot_owner_id' => $hubspot_owner_id,
        'what_area__s__are_you_interested_in_addressing' => $body_area_most_interested,
      ];
    }else{
      if($scheduled_event_name == "Laser Body Renewal Consultation in Glastonbury CT"){
        $properties1 = [
          'firstname' => $first_name,
          'lastname' => $last_name,
          'lifecyclestage' => $lifecyclestage,
          'phone' => $phone_number,
          'how_did_you_hear_about_us_' => $how_did_you_hear_about_us,
          'consultation_office_location' => $consultation_loc,
          'consultation_type' => $consultation_type,
          'consultation_status' => $consultation_status,
          'hubspot_owner_id' => $hubspot_owner_id,
          'what_area__s__are_you_interested_in_addressing' => $body_area_most_interested,
        ];
      }else{
        if($scheduled_event_name == "Laser Body Renewal Consultation in Branford CT Office"){
          $properties1 = [
            'firstname' => $first_name,
            'lastname' => $last_name,
            'lifecyclestage' => $lifecyclestage,
            'phone' => $phone_number,
            'how_did_you_hear_about_us_' => $how_did_you_hear_about_us,
            'consultation_office_location' => $consultation_loc,
            'consultation_type' => $consultation_type,
            'consultation_status' => $consultation_status,
            'hubspot_owner_id' => $hubspot_owner_id,
            'what_area__s__are_you_interested_in_addressing' => $body_area_most_interested,
          ];
        }else{
          $properties1 = [
            'firstname' => $first_name,
            'lastname' => $last_name,
            'lifecyclestage' => $lifecyclestage,
            'phone' => $phone_number,
            // 'how_did_you_hear_about_us_' => $how_did_you_hear_about_us,
            'consultation_office_location' => $consultation_loc,
            'consultation_type' => $consultation_type,
            'consultation_status' => $consultation_status,
            'hubspot_owner_id' => $hubspot_owner_id,
            // 'what_area__s__are_you_interested_in_addressing' => $body_area_most_interested,
          ];
        }
      }
    }


    // $properties1 = [
    //   'firstname' => $first_name,
    //   'lastname' => $last_name,
    //   'lifecyclestage' => $lifecyclestage,
    //   'phone' => $phone_number,
    //   'how_did_you_hear_about_us_' => $how_did_you_hear_about_us,
    //   'consultation_office_location' => $consultation_loc,
    //   'consultation_type' => $consultation_type,
    //   'consultation_status' => $consultation_status,
    //   'hubspot_owner_id' => $hubspot_owner_id,
    //   'what_area__s__are_you_interested_in_addressing' => $body_area_most_interested,
    // ];
    $simplePublicObjectBatchInput1 = new SimplePublicObjectBatchInput([
      // 'id_property' => 'my_unique_property_name',
      // 'id' => '4813',
      'id' => $contact_id,
      'properties' => $properties1
    ]);
    $batchInputSimplePublicObjectBatchInput = new BatchInputSimplePublicObjectBatchInput([
      'inputs' => [$simplePublicObjectBatchInput1],
    ]);

    try{
      $apiResponse_lifecycle = $client->crm()->contacts()->batchApi()->update($batchInputSimplePublicObjectBatchInput_lifecycle);
      $apiResponse = $client->crm()->contacts()->batchApi()->update($batchInputSimplePublicObjectBatchInput);
      // var_dump($apiResponse);
      // $call_deal = true;

      if($scheduled_event_name == "Laser Body Renewal Consultation in Wilton CT Office"){
        $call_deal = true;
      }else{
        if($scheduled_event_name == "Laser Body Renewal Consultation in Glastonbury CT"){
          $call_deal = true;
        }else{
          if($scheduled_event_name == "Laser Body Renewal Consultation in Branford CT Office"){
            $call_deal = true;
          }
        }
      }

      // $sql15 =sprintf("INSERT INTO new_contact SET  id='200',payload='contact update'");
      // if(!($res25 = mysqli_query($myConnection,$sql15))){echo "ERROR : -".$sql15." : - ".mysqli_error($myConnection); exit;}


    }catch(ApiException $e){
      echo "Exception when calling batch_api->update: ", $e->getMessage();
    }

  }catch (ApiException $e){
    // add contact

    // $properties1 = [
    //   'email' => 'tejaswita-new@esenseit.in',
    //   'firstname' => 'Tejaswita',
    //   'lastname' => 'Shrivastava',
    //   'lifecyclestage' => 'opportunity',
    //   'phone' => '+91 9823883244',
    //   'how_did_you_hear_about_us_' => "Facebook",
    //   'consultation_office_location' => "WIlton CT",
    //   'consultation_type' => "In Person",
    //   'consultation_status' => "Consultation Scheduled",
    //   'hubspot_owner_id' => "434535262"
    // ];

    $properties1 = [
      'email' => $contactEmail,
      'firstname' => $first_name,
      'lastname' => $last_name,
      'lifecyclestage' => $lifecyclestage,
      'phone' => $phone_number,
      'how_did_you_hear_about_us_' => $how_did_you_hear_about_us,
      'consultation_office_location' => $consultation_loc,
      'consultation_type' => $consultation_type,
      'consultation_status' => $consultation_status,
      'hubspot_owner_id' => $hubspot_owner_id,
      'what_area__s__are_you_interested_in_addressing' => $body_area_most_interested,
    ];

    $simplePublicObjectInputForCreate1 = new SimplePublicObjectInputForCreate([
      // 'associations' => [$publicAssociationsForObject1],
      'properties' => $properties1
    ]);
    $batchInputSimplePublicObjectInputForCreate = new BatchInputSimplePublicObjectInputForCreate([
      'inputs' => [$simplePublicObjectInputForCreate1],
    ]);

    try {
      $apiResponse = $client->crm()->contacts()->batchApi()->create($batchInputSimplePublicObjectInputForCreate);
      // var_dump($apiResponse);
      // $sql15 =sprintf("INSERT INTO new_contact SET  id='200',payload='contact inserted'");
      // if(!($res25 = mysqli_query($myConnection,$sql15))){echo "ERROR : -".$sql15." : - ".mysqli_error($myConnection); exit;}


      try {

        $apiResponse = $client->crm()->contacts()->basicApi()->getById($contactEmail, null, null, null, false, 'email');
        $list_details = json_decode($apiResponse, true);
        // print_r($list_details);
        // var_dump($apiResponse);
        $contact_id = $list_details['id'];
        // echo "contact_id". $contact_id;
        // $deal_name = 'Tejaswita Shrivastava';
        $call_deal = true;

        // $sql15 =sprintf("INSERT INTO new_contact SET  id='200',payload='deal called'");
        // if(!($res25 = mysqli_query($myConnection,$sql15))){echo "ERROR : -".$sql15." : - ".mysqli_error($myConnection); exit;}

      }catch (ApiException $e){
        echo "Exception when calling batch_api->create: ", $e->getMessage();
      }

    }catch (ApiException $e) {
      echo "Exception when calling batch_api->create: ", $e->getMessage();
    }
  }

  if($call_deal == true){
    // echo "inside call deal";
    // $contact_id = "4813";
    include "deal.php";
  }
